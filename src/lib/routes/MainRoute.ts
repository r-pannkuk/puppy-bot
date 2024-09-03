import { ApiRequest, ApiResponse, methods, Route, RouteOptions } from "@sapphire/plugin-api";

export class MainRoute extends Route {
    public constructor(context: Route.LoaderContext, options?: RouteOptions) {
        super(context, {
            ...options,
            route: ''
        });
    }

    public [methods.GET](_request: ApiRequest, response: ApiResponse) {
        response.json({
            message: 'Landing page!'
        });
    }

    public [methods.POST](_request: ApiRequest, response: ApiResponse) {
        response.json({
            message: 'Landing page!'
        });
    }
}