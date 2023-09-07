declare type Loading = {
    state: "loading";
};
declare type Errored = {
    error: string;
    state: "errored";
};
declare type Succeeded<T> = {
    data: T;
    state: "succeeded";
};
export declare type AsyncState<T> = Loading | Errored | Succeeded<T>;
export declare function isLoading<T>(state: AsyncState<T>): state is Loading;
export declare function hasErrored<T>(state: AsyncState<T>): state is Errored;
export declare function useAsyncRequest<T>(request: () => Promise<T>): AsyncState<T>;
export declare function useAsyncRequestWithParam<T1, T2>(request: (param: T2) => Promise<T1>, param: T2): AsyncState<T1>;
export declare function useAsyncRequestWithTwoParams<T1, T2, T3>(request: (param1: T2, param2: T3) => Promise<T1>, param1: T2, param2: T3): AsyncState<T1>;
export {};
