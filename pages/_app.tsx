import type { AppProps } from "next/app";
import "../styles/globals.css";
import Nav from "../components/Nav";
import { useEffect } from "react";
import { useVideosStore } from "../store/videos";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }: AppProps) {
  const hydrate = useVideosStore((s) => s.hydrate);
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <Nav />
      <main style={{ padding: "16px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={router.asPath}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
