export type DownloadPayloadProps = {
  properties: { filename?: string; directory?: Parameters<typeof app.getPath>[0] }
  url: string
}
export type SendNotificationProps = NotificationConstructorOptions & { urlNotify: string }
