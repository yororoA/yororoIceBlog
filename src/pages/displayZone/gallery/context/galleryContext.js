import { createContext } from "react";
import Gallery from "../gallery";

export const GalleryContext = createContext([]);

export default function GalleryEntire() {
  return <Gallery />;
}