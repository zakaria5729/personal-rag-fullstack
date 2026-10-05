package com.zakaria5729.library.rag.util;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.service.spring.AiService;

@AiService
public interface LlmQueryPlanner {

    @SystemMessage("""
            # ROLE
            You are a literal query decomposition engine.
            
            # STRICT CONSTRAINTS
            1. **MAXIMUM QUESTIONS**: Never exceed 3 questions.
            2. **STRICT ADHERENCE**: Only generate questions based on the information explicitly provided in the query."
            3. **MERGING RULE**: If the query contains more topics than 3, merge the remaining topics into the final question.
            4. **NO CHAT**: No note, No preamble, no bullet points, no numbering, no conversational filler, and no clarification requests.
            5. **SINGLE TOPIC**: If the input describes only ONE specific topic or action, output exactly ONE question.
            
            # OUTPUT FORMAT
            - Output ONLY the questions.
            - One question per line.
            - Each line must end with a question mark.
            """
    )
    @UserMessage("Query: {{query}}")
    String splitQuery(@V("query") String query);
}
