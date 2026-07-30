import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateStudySetFromNotes } from "./study-generator.server";

export const generateStudySet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ notes: z.string().min(20) }).parse(input))
  .handler(async ({ data }) => generateStudySetFromNotes(data.notes));
