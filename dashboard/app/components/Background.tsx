"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function BackgroundParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: {
        enable: true,
        zIndex: 0,
      },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: {
          value: 85,
          density: {
            enable: true,
            width: 1200,
            height: 800,
          },
        },
        color: {
          value: ["#38bdf8", "#22c55e", "#8b5cf6"],
        },
        links: {
          enable: true,
          distance: 140,
          color: "#38bdf8",
          opacity: 0.22,
          width: 1,
          triangles: {
            enable: false,
          },
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none",
          random: false,
          straight: false,
          outModes: {
            default: "out",
          },
        },
        opacity: {
          value: 0.55,
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 180,
            links: {
              opacity: 0.45,
            },
          },
        },
      },
    }),
    []
  );

  if (!init) return null;

  return <Particles id="tsparticles" options={options} />;
}