import gpt_2_simple as gpt2
import argparse
import os

import sys
import time

# from daemonize import Daemonize


class SimulationManager():
    def __init__(self):
        self.session = gpt2.start_tf_sess()
        self.runs = {
            '174037015858249730': 'Hazelyn',
            '287188227667001345': 'Huz',
            '138398309776621569': 'Native',
            '260288776360820736': 'Dog',
            '310031015932329985': 'Randy'
        }

        self.currentModel = None

        # self.simulations = dict()

        # self.simulations['174037015858249730'] = gpt2.load_gpt2(
        #     sess, run_name='Hazelyn'
        # )
        # self.simulations['287188227667001345'] = gpt2.load_gpt2(
        #     sess, run_name='Huz'
        # )
        # self.simulations['138398309776621569'] = gpt2.load_gpt2(
        #     sess, run_name='Native'
        # )
        # self.simulations['260288776360820736'] = gpt2.load_gpt2(
        #     sess, run_name='Dog'
        # )
        # self.simulations['310031015932329985'] = gpt2.load_gpt2(
        #     sess, run_name='Randy'
        # )
        pass

    def get_text(self, id, prefix, suffix, count):
        if not id in self.runs:
            raise 'The simulated checkpoint was not found for that input.'

        run_name = self.runs[id]

        if self.currentModel != run_name:
            gpt2.load_gpt2(
                self.session,
                run_name=run_name
            )

        text = gpt2.generate(self.session,
                             length=200,
                             top_k=40,
                             temperature=0.7,
                             run_name=run_name,
                             include_prefix=False,
                             prefix=prefix,
                             truncate=suffix,
                             nsamples=count,
                             batch_size=count,
                             return_as_list=True
                             )

        text = [s.replace(prefix, '').replace(suffix, '') for s in text]

        return text

simulationManager = None

def program_run(args):
    return simulationManager.get_text(args.id, args.prefix, args.suffix, args.count)
    pass

def program_cleanup():
    global simulationManager
    return sys.exit(1)
    pass


def reload_program_config():
    global simulationManager
    simulationManager = SimulationManager()
    pass

reload_program_config()

parser = argparse.ArgumentParser(
    description='Generates text based on the input model ID.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
subparsers = parser.add_subparsers(help='Commands which can be run.')

parser_run = subparsers.add_parser('run', help='Runs the text generator.')
parser_run.add_argument('id',  type=str, help='Which user to simulate using a trained model.')
parser_run.add_argument('--prefix', type=str, default="<|startoftext|>", help='Model prefix to use for separation.')
parser_run.add_argument('--suffix', type=str, default="<|endoftext|>", help='Suffix used for termination of generated text.')
parser_run.add_argument('--count', type=int, default=5, help='Number of results to generate.')
parser_run.set_defaults(func=program_run)

parser_reload = subparsers.add_parser('reload', help='Reloads the tensorflow instance.')
parser_reload.set_defaults(func=reload_program_config)

parser_exit = subparsers.add_parser('exit', help='Exits the program cleanly.')
parser_exit.set_defaults(func=program_cleanup)

def main():
    args = parser.parse_args()
    return args.func(args)

daemon = Daemonize(
    app='Puppy-Bot Simulator',
    pid='/var/run/puppy-bot-discord/simulator.pid',
    action=main
)
daemon.start()

# if __name__ == "__main__":
#     main()