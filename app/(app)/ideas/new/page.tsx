import { redirect } from "next/navigation";

export default function IdeasNewPage() {
  // Ideas and projects share one form — idea-stage = prize $0.
  redirect("/projects/new");
}
