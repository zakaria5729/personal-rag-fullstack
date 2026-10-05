package com.zakaria5729.library.rag.util;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;

public final class RagUtil {

    public static final String DEFAULT_STORE_PREFIX = "default";

    public static final Logger ragLogger = LogManager.getLogger();

    public static String getVectorStoreTable(String storePrefix) {
        if (storePrefix == null || storePrefix.isEmpty()) {
            storePrefix = DEFAULT_STORE_PREFIX;
        }
        return storePrefix + "_vector_store".toLowerCase(Locale.ENGLISH);
    }

    public static String floatArrayToVectorString(float[] array) {
        if (array == null || array.length == 0) {
            return "[]";
        }
        var sb = new StringBuilder(array.length * 10);
        sb.append('[');
        for (var i = 0; i < array.length; i++) {
            sb.append(array[i]);
            if (i < array.length - 1) sb.append(',');
        }
        sb.append(']');
        return sb.toString();
    }

    public static boolean isValidURL(String url) {
        try {
            if (!url.matches("^[a-zA-Z][a-zA-Z0-9+.-]*://.*")) {
                url = "http://" + url;
            }
            var uri = new URI(url);
            return uri.getHost() != null;
        } catch (Exception e) {
            return false;
        }
    }

    public static String extractTextFromMultipartPdf(MultipartFile pdfFile) {
        try (var document = Loader.loadPDF(pdfFile.getBytes())) {
            var stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        } catch (Exception e) {
            ragLogger.error("Failed to process pdf", e);
            return null;
        }
    }

    public static String fetchAndExtractContentFromUrl(String url) {
        try {
            var doc = Jsoup.connect(url).get();
            return doc.body().text();
        } catch (IOException e) {
            ragLogger.error(e);
        }

        return null;
    }
}
