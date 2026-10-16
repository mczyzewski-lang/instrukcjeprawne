import EditQuestion from "../[id]/page";

export const metadata = { title: "Nowe pytanie" };

export default function NewQuestion() {
  return <EditQuestion params={Promise.resolve({ id: "nowe" })} />;
}
