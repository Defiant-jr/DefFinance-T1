type CreateAppOptions = {
    withFrontend?: boolean;
};
export declare function createApp(options?: CreateAppOptions): Promise<{
    app: import("express-serve-static-core").Express;
}>;
export {};
