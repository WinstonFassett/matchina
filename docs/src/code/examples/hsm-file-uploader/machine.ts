import { addEventApi, createMachine, defineStates } from "matchina";

export const appStates = defineStates({
  Online: (files: Record<string, { key: string; pct?: number }> = {}) => ({ files }),
  Offline: (files: Record<string, { key: string; pct?: number }> = {}) => ({ files }),
});

type FileState =
  | { key: "Queued" }
  | { key: "Uploading"; pct: number }
  | { key: "Verifying" }
  | { key: "Completed" }
  | { key: "Error" };

export function createUploaderMachine() {
  const base = createMachine(
    appStates,
    {
      Online: {
        enqueue: (id?: string) => (s: any) => {
          const fileId = id ?? Math.random().toString(36).slice(2);
          const files = { ...s.files, [fileId]: { key: "Queued" } as FileState };
          return appStates.Online(files);
        },
        startUpload: (id: string) => (s: any) => {
          const cur = s.files[id] as FileState | undefined;
          if (!cur || cur.key !== "Queued") return s;
          const files = { ...s.files, [id]: { key: "Uploading", pct: 0 } as FileState };
          return appStates.Online(files);
        },
        progress: (id: string, pct: number) => (s: any) => {
          const cur = s.files[id] as FileState | undefined;
          if (!cur || cur.key !== "Uploading") return s;
          const files = { ...s.files, [id]: { key: "Uploading", pct } as FileState };
          return appStates.Online(files);
        },
        uploadOk: (id: string) => (s: any) => {
          const cur = s.files[id] as FileState | undefined;
          if (!cur || cur.key !== "Uploading") return s;
          const files = { ...s.files, [id]: { key: "Verifying" } as FileState };
          return appStates.Online(files);
        },
        verified: (id: string) => (s: any) => {
          const cur = s.files[id] as FileState | undefined;
          if (!cur || cur.key !== "Verifying") return s;
          const files = { ...s.files, [id]: { key: "Completed" } as FileState };
          return appStates.Online(files);
        },
        uploadErr: (id: string) => (s: any) => {
          if (!s.files[id]) return s;
          const files = { ...s.files, [id]: { key: "Error" } as FileState };
          return appStates.Online(files);
        },
        retry: (id: string) => (s: any) => {
          if (!s.files[id]) return s;
          const files = { ...s.files, [id]: { key: "Queued" } as FileState };
          return appStates.Online(files);
        },
        wentOffline: () => (s: any) => appStates.Offline(s.files),
      },
      Offline: {
        enqueue: (id?: string) => (s: any) => {
          const fileId = id ?? Math.random().toString(36).slice(2);
          const files = { ...s.files, [fileId]: { key: "Queued" } as FileState };
          return appStates.Offline(files);
        },
        cameOnline: () => (s: any) => appStates.Online(s.files),
      },
    },
    appStates.Online()
  );

  return addEventApi(base);
}
