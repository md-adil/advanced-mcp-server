import { sendEmail } from "../src/comm/handler.ts";

console.log(
  await sendEmail({
    to: ["md.adil@bfhl.in"],
    subject: "Hello",
    body: "Hey there",
    isHtml: false,
  })
);
