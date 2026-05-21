"use client";

import EditBlogPage from "../[id]/page";

export default function NewBlogPost() {
  return <EditBlogPage params={Promise.resolve({ id: "new" })} />;
}
