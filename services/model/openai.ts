import OpenAI from "openai";
import { OPEN_AI_API_KEY } from "../config";

const openai = new OpenAI({
  apiKey: OPEN_AI_API_KEY,
}); 

export default openai;

