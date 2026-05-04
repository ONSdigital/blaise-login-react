import { useEffect, useState } from "react";

type Loading = {
  state: "loading";
};

type Errored = {
  error: string;
  state: "errored";
};

type Succeeded<T> = {
  data: T;
  state: "succeeded";
};

export type AsyncState<T> = Loading | Errored | Succeeded<T>;

export function isLoading<T>(state: AsyncState<T>): state is Loading {
  return state.state === "loading";
}

export function hasErrored<T>(state: AsyncState<T>): state is Errored {
  return state.state === "errored";
}

const loading = (): Loading => ({ state: "loading" });
const errored = (error: string): Errored => ({ state: "errored", error });
const succeeded = <T>(data: T): Succeeded<T> => ({ state: "succeeded", data });

export function useAsyncRequest<T>(request: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>(loading);

  const [prevRequest, setPrevRequest] = useState(() => request);

  if (request !== prevRequest) {
    setPrevRequest(() => request);
    setState(loading());
  }

  useEffect(() => {
    let ignore = false;

    const executeAsyncRequest = async () => {
      try {
        const response = await request();

        if (!ignore) {
          setState(succeeded(response));
        }
      } catch (error: unknown) {
        if (!ignore) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          setState(errored(errorMessage));
        }
      }
    };

    executeAsyncRequest();

    return () => {
      ignore = true;
    };
  }, [request]);

  return state;
}
