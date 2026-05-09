import { create } from "zustand";
const init = (set: any) => {
  return {
    //
    moodColor1: "#ffffff",
    //
  };
};
export type AppType = ReturnType<typeof init>;
export const useApp = create<AppType>(init);
