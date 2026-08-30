declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys?: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendResult {
    statusCode: number;
    body: string;
  }

  function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: {
      TTL?: number;
      urgency?: string;
      topic?: string;
      headers?: Record<string, string>;
    }
  ): Promise<SendResult>;

  function generateVapidKeys(): {
    publicKey: string;
    privateKey: string;
  };

  export { setVapidDetails, sendNotification, generateVapidKeys, SendResult, PushSubscription };
}
