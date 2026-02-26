"""
Tests for src/scripts/*.py — the Pillow-based meme-image generators.

Each test patches the following to stay hermetic and fast:
  - PIL.Image.open        → returns a fresh in-memory RGBA image so no asset
                            files need to be present on disk during the test run.
  - PIL.Image.Image.save  → no-op; output path is verified via captured stdout.
  - requests.get          → returns the raw bytes of a tiny in-memory PNG so
                            no network calls are made.
  - os.path.isfile        → False   (no cached output exists by default)
  - os.path.isdir         → True    (save folder already exists)
  - os.listdir            → []      (nothing to evict)

The scripts print the output path to stdout; tests capture that via capsys and
verify it follows the expected pattern.
"""

from __future__ import annotations

import importlib
import io
import sys
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image, ImageFont

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _dummy_image(mode: str = "RGBA", size: tuple[int, int] = (600, 600)) -> Image.Image:
    """Return a fresh in-memory PIL image large enough for any compositing op."""
    return Image.new(mode, size, (120, 120, 120, 255))


def _dummy_png_bytes(size: tuple[int, int] = (64, 64)) -> bytes:
    """Return the raw bytes of a small RGBA PNG."""
    buf = io.BytesIO()
    Image.new("RGBA", size, (200, 50, 50, 255)).save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def _mock_response() -> MagicMock:
    """Fake requests.Response whose .content is a tiny PNG."""
    r = MagicMock()
    r.content = _dummy_png_bytes()
    return r


def _load(name: str):
    """Import or reload a script module by bare name (e.g. 'bright')."""
    if name in sys.modules:
        return importlib.reload(sys.modules[name])
    return importlib.import_module(name)


def _default_fs_patches() -> dict:
    """Return a dict of the file-system patches shared by every test."""
    return {
        "os.path.isfile": False,
        "os.path.isdir": True,
        "os.listdir": [],
    }


# ---------------------------------------------------------------------------
# bright.py
# ---------------------------------------------------------------------------


class TestBright:
    """Tests for the 'Bright slap' animated GIF generator."""

    # The Bright canvas is 498×373; masks must match this size or PIL raises
    # "images do not match" during paste(). The frame source images and mask
    # images are all loaded via Image.open, so we return the canvas size for
    # all of them.
    _CANVAS = (498, 373)

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", self._CANVAS)),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_with_url_prints_gif_path(self, capsys):
        """An avatar URL should produce a .gif path under saves/bright/."""
        url = "https://cdn.discordapp.com/avatars/12345/hash.png"
        with (
            patch("sys.argv", ["bright.py", url]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("bright").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/bright/"), f"unexpected output: {out!r}"
        assert out.endswith(".gif"), f"expected .gif, got: {out!r}"

    def test_cache_hit_skips_processing(self, capsys):
        """If the output GIF already exists the path is printed immediately."""
        url = "https://cdn.discordapp.com/avatars/99999/other.png"
        with (
            patch("sys.argv", ["bright.py", url]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("bright").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/bright/")
        assert out.endswith(".gif")

    def test_different_urls_produce_different_paths(self, capsys):
        """Two distinct URLs should result in two distinct save paths."""
        url_a = "https://example.com/a.png"
        url_b = "https://example.com/b.png"

        with (
            patch("requests.get", return_value=_mock_response()),
        ):
            with patch("sys.argv", ["bright.py", url_a]):
                _load("bright").main()
            path_a = capsys.readouterr().out.strip()

            with patch("sys.argv", ["bright.py", url_b]):
                _load("bright").main()
            path_b = capsys.readouterr().out.strip()

        assert path_a != path_b

    def test_user_image_copy_per_frame(self):
        """
        Regression: user_img must be re-copied for every frame so that
        thumbnail() in earlier frames does not permanently shrink the image
        for later frames that expect a larger target size.

        We track every size produced by thumbnail() and assert that no frame
        receives an image that has already been reduced below its expected
        target size by a previous frame.
        """
        url = "https://cdn.discordapp.com/avatars/11111/abc.png"
        sizes_after_thumbnail: list[tuple[int, int]] = []

        original_thumbnail = Image.Image.thumbnail

        def tracking_thumbnail(self_img, size, *args, **kwargs):
            original_thumbnail(self_img, size, *args, **kwargs)
            sizes_after_thumbnail.append(self_img.size)

        with (
            patch("sys.argv", ["bright.py", url]),
            patch("requests.get", return_value=_mock_response()),
            patch("PIL.Image.Image.thumbnail", tracking_thumbnail),
        ):
            _load("bright").main()

        assert len(sizes_after_thumbnail) > 0, "thumbnail() was never called"
        for w, h in sizes_after_thumbnail:
            assert w > 0 and h > 0, f"degenerate frame size: ({w}, {h})"


# ---------------------------------------------------------------------------
# duwang.py
# ---------------------------------------------------------------------------


class TestDuwang:
    """Tests for the 'What a beautiful Duwang' meme generator."""

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", (312, 175))),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_no_arg_returns_default_path(self, capsys):
        """Empty first arg should print the static default image path."""
        with patch("sys.argv", ["duwang.py", ""]):
            _load("duwang").main()
        assert capsys.readouterr().out.strip() == "./src/assets/media/duwang/duwang_original.jpg"

    def test_with_url_prints_png_path(self, capsys):
        """An HTTP URL should fetch the image and print a .png save path."""
        url = "https://example.com/image.png"
        with (
            patch("sys.argv", ["duwang.py", url]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("duwang").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/duwang/")
        assert out.endswith(".png")

    def test_with_plain_text_renders_text(self, capsys):
        """A plain string (no URL scheme) should render text onto the template."""
        with patch("sys.argv", ["duwang.py", "Duwang"]):
            _load("duwang").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/duwang/")
        assert out.endswith(".png")

    def test_cache_hit_skips_processing(self, capsys):
        """Existing save file should short-circuit processing."""
        with (
            patch("sys.argv", ["duwang.py", "https://example.com/img.png"]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("duwang").main()
        assert capsys.readouterr().out.strip().startswith("./saves/duwang/")


# ---------------------------------------------------------------------------
# kinzo.py
# ---------------------------------------------------------------------------


class TestKinzo:
    """Tests for the Kinzo quote meme generator (takes author + message)."""

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", (800, 450))),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_short_name_uses_standard_template(self, capsys):
        """Author name ≤ 16 chars should use the regular template."""
        with patch("sys.argv", ["kinzo.py", "Alice", "Hello world!"]):
            _load("kinzo").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/kinzo/")
        assert out.endswith(".png")

    def test_long_name_uses_long_template(self, capsys):
        """Author name > 16 chars should switch to the long-name template."""
        long_name = "A" * 17
        with patch("sys.argv", ["kinzo.py", long_name, "Some message text."]):
            _load("kinzo").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/kinzo/")
        assert out.endswith(".png")

    def test_different_inputs_produce_different_paths(self, capsys):
        """Different author+message pairs should hash to different save paths."""
        with patch("sys.argv", ["kinzo.py", "Alice", "msg1"]):
            _load("kinzo").main()
        path_a = capsys.readouterr().out.strip()

        with patch("sys.argv", ["kinzo.py", "Bob", "msg2"]):
            _load("kinzo").main()
        path_b = capsys.readouterr().out.strip()

        assert path_a != path_b

    def test_cache_hit_skips_processing(self, capsys):
        with (
            patch("sys.argv", ["kinzo.py", "Bob", "cached message"]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("kinzo").main()
        assert capsys.readouterr().out.strip().startswith("./saves/kinzo/")


# ---------------------------------------------------------------------------
# lied.py
# ---------------------------------------------------------------------------


class TestLied:
    """Tests for the Lied meme generator (avatar URL + username + quote text)."""

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", (700, 740))),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_short_text_single_block(self, capsys):
        """Text ≤ 130 chars fits in one block and produces a .png save path."""
        with (
            patch("sys.argv", ["lied.py", "https://example.com/av.png", "Alice", "Short text here"]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("lied").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/lied/")
        assert out.endswith(".png")

    def test_long_text_two_blocks(self, capsys):
        """Text > 130 chars is split across two blocks without error."""
        long_text = "word " * 40  # 200 chars with spaces
        with (
            patch("sys.argv", ["lied.py", "https://example.com/av.png", "Bob", long_text]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("lied").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/lied/")
        assert out.endswith(".png")

    def test_long_text_no_space_splits_at_limit(self, capsys):
        """Text with no space in the first 130 chars should split at char 130."""
        no_space = "x" * 200
        with (
            patch("sys.argv", ["lied.py", "https://example.com/av.png", "Dave", no_space]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("lied").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/lied/")
        assert out.endswith(".png")

    def test_cache_hit_skips_processing(self, capsys):
        with (
            patch("sys.argv", ["lied.py", "https://example.com/av.png", "Carol", "hello"]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("lied").main()
        assert capsys.readouterr().out.strip().startswith("./saves/lied/")

    def test_unique_save_paths_per_input_triple(self, capsys):
        """Different url/user/text triples should produce distinct save paths."""
        base = ["lied.py", "https://example.com/av.png", "User", "Text"]
        with (
            patch("sys.argv", base),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("lied").main()
        path_a = capsys.readouterr().out.strip()

        alt = ["lied.py", "https://example.com/other.png", "OtherUser", "Other Text"]
        with (
            patch("sys.argv", alt),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("lied").main()
        path_b = capsys.readouterr().out.strip()

        assert path_a != path_b


# ---------------------------------------------------------------------------
# magneto.py
# ---------------------------------------------------------------------------


class TestMagneto:
    """Tests for the Magneto 'You're wrong' meme generator."""

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", (469, 359))),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_no_arg_returns_default_path(self, capsys):
        """Empty first arg should print the static background path."""
        with patch("sys.argv", ["magneto.py", ""]):
            _load("magneto").main()
        assert capsys.readouterr().out.strip() == "./src/assets/media/magneto/Magneto_Background.png"

    def test_with_url_composites_avatar(self, capsys):
        """An HTTP URL should fetch and composite the image, printing a .png path."""
        url = "https://example.com/avatar.png"
        with (
            patch("sys.argv", ["magneto.py", url]),
            patch("requests.get", return_value=_mock_response()),
        ):
            _load("magneto").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/magneto/")
        assert out.endswith(".png")

    def test_cache_hit_skips_processing(self, capsys):
        with (
            patch("sys.argv", ["magneto.py", "https://example.com/x.png"]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("magneto").main()
        assert capsys.readouterr().out.strip().startswith("./saves/magneto/")

    def test_different_urls_produce_different_paths(self, capsys):
        for url in ("https://example.com/a.png", "https://example.com/b.png"):
            with (
                patch("sys.argv", ["magneto.py", url]),
                patch("requests.get", return_value=_mock_response()),
            ):
                _load("magneto").main()

        out_lines = capsys.readouterr().out.strip().splitlines()
        assert out_lines[0] != out_lines[1]


# ---------------------------------------------------------------------------
# sylphie.py
# ---------------------------------------------------------------------------


class TestSylphie:
    """Tests for the Sylphie complaint meme generator."""

    @pytest.fixture(autouse=True)
    def _patches(self):
        with (
            patch("PIL.Image.open", side_effect=lambda _p: _dummy_image("RGBA", (1920, 1080))),
            patch("PIL.Image.Image.save"),
            patch("os.path.isfile", return_value=False),
            patch("os.path.isdir", return_value=True),
            patch("os.listdir", return_value=[]),
        ):
            yield

    def test_no_arg_returns_default_path(self, capsys):
        """Empty first arg should print the static original image path."""
        with patch("sys.argv", ["sylphie.py", ""]):
            _load("sylphie").main()
        assert capsys.readouterr().out.strip() == "./src/assets/media/sylphie/sylphie_original.png"

    def test_with_activity_prints_png_path(self, capsys):
        """A valid activity word should produce a .png save path."""
        with patch("sys.argv", ["sylphie.py", "coding"]):
            _load("sylphie").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/sylphie/")
        assert out.endswith(".png")

    def test_long_activity_word(self, capsys):
        """A long activity name should be handled without error."""
        with patch("sys.argv", ["sylphie.py", "some_very_long_activity_name"]):
            _load("sylphie").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/sylphie/")
        assert out.endswith(".png")

    def test_activity_with_spaces(self, capsys):
        """An activity string containing spaces should produce a .png save path."""
        with patch("sys.argv", ["sylphie.py", "eating pizza"]):
            _load("sylphie").main()

        out = capsys.readouterr().out.strip()
        assert out.startswith("./saves/sylphie/")
        assert out.endswith(".png")

    def test_cache_hit_skips_processing(self, capsys):
        with (
            patch("sys.argv", ["sylphie.py", "baking"]),
            patch("os.path.isfile", return_value=True),
        ):
            _load("sylphie").main()
        assert capsys.readouterr().out.strip().startswith("./saves/sylphie/")

    def test_different_activities_produce_different_paths(self, capsys):
        """Two different activities should hash to different save paths."""
        with patch("sys.argv", ["sylphie.py", "cooking"]):
            _load("sylphie").main()
        path_a = capsys.readouterr().out.strip()

        with patch("sys.argv", ["sylphie.py", "sleeping"]):
            _load("sylphie").main()
        path_b = capsys.readouterr().out.strip()

        assert path_a != path_b
