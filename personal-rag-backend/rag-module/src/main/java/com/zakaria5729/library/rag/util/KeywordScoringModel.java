package com.zakaria5729.library.rag.util;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.model.scoring.ScoringModel;

import java.util.ArrayList;
import java.util.List;

public class KeywordScoringModel implements ScoringModel {

    @Override
    public Response<Double> score(TextSegment textSegment, String query) {
        return Response.from(calculateScore(textSegment.text(), query));
    }

    @Override
    public Response<List<Double>> scoreAll(List<TextSegment> segments, String query) {
        var scores = new ArrayList<Double>();
        for (var segment : segments) {
            scores.add(calculateScore(segment.text(), query));
        }
        return Response.from(scores);
    }

    private Double calculateScore(String text, String query) {
        var score = 0.0;
        var lowerText = text.toLowerCase();
        var lowerQuery = query.toLowerCase();
        var queryWords = lowerQuery.split("\\s+");

        for (var word : queryWords) {
            if (lowerText.contains(word)) {
                score += 1.0;
            }
        }
        if (lowerText.contains(lowerQuery)) {
            score += 5.0;
        }
        return score;
    }
}
