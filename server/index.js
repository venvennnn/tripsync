import { createApp } from "./app.js";

const app = createApp();
const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TripSync on http://0.0.0.0:${PORT}`);
});
