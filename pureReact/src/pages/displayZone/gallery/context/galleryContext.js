import { createContext } from "react";
import Gallery from "../gallery";

export const GalleryContext = createContext([[], () => {}, true, () => {}]);

export default function GalleryEntire() {
  return <Gallery />;
}