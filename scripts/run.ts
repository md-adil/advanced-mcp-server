import { makeRequest } from "../src/elastic/handler.ts";

console.log(
  await makeRequest("https://localhost:9200/_cluster/settings", {
    host: "https://localhost:9200",
    username: "elastic",
    password: "967iMgKSU7U05k5PhOP76FQ3",
  })
);
