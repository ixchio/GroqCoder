/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";

export function useBroadcastChannel(
  channelName: string,
  onMessageReceived: (message: any) => void
) {
  const channel = useMemo(
    () => getSingletonChannel(channelName),
    [channelName]
  );
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!isSubscribed.current || process.env.NODE_ENV !== "development") {
      channel.onmessage = (event) => onMessageReceived(event.data);
    }
    return () => {
      if (isSubscribed.current || process.env.NODE_ENV !== "development") {
        channel.close();
        isSubscribed.current = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postMessage = useCallback(
    (message: any) => {
      channel?.postMessage(message);
    },
    [channel]
  );

  return {
    postMessage,
  };
}

const channelInstances: { [key: string]: BroadcastChannel } = {};

export const getSingletonChannel = (name: string): BroadcastChannel => {
  if (!channelInstances[name]) {
    channelInstances[name] = new BroadcastChannel(name);
  }
  return channelInstances[name];
};
