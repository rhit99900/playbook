"use client";

import { useState } from "react";
import { Textarea } from "../ui/textarea";

const PromptInput = () => {

  const [ prompt, setPrompt ] = useState<string>('');

  return (
    <div className="w-full">
      <Textarea 
        placeholder="How can I help you?"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
    </div>
  )
}

export default PromptInput;