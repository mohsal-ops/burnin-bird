import db from "@/db/db";

export default async function getAllTypes() {
  const types = await db.types.findMany();
  return types;
}
