import type { Subject, Tense } from "../dataset/types";

export const subjectLabels: Record<Subject, string> = {
  eu: "eu",
  tu: "tu",
  ele_ela: "ele/ela",
  nos: "nós",
  voces: "vocês",
  eles_elas: "eles/elas",
};

export const tenseLabels: Record<Tense, string> = {
  present_indicative: "Present",
  preterite: "Preterite",
  imperfect: "Imperfect",
  future: "Future",
};
