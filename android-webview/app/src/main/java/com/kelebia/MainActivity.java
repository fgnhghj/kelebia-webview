package com.kelebia;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    // Change this URL to match your deployed server (IP or domain)
    private static final String APP_URL = "https://isetkl-classroom.gleeze.com";

    private WebView webView;
    private ValueCallback<Uri[]> fileUploadCallback;

    /**
     * Modern replacement for startActivityForResult.
     * Handles both single-file and multi-file results from the file chooser.
     */
    private final ActivityResultLauncher<Intent> fileChooserLauncher =
            registerForActivityResult(
                    new ActivityResultContracts.StartActivityForResult(),
                    result -> {
                        if (fileUploadCallback == null) return;

                        Uri[] results = null;

                        if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                            Intent data = result.getData();

                            // Multiple files selected via clip data
                            if (data.getClipData() != null) {
                                int count = data.getClipData().getItemCount();
                                results = new Uri[count];
                                for (int i = 0; i < count; i++) {
                                    results[i] = data.getClipData().getItemAt(i).getUri();
                                }
                            }
                            // Single file selected via data URI
                            else if (data.getData() != null) {
                                results = new Uri[]{ data.getData() };
                            }
                        }

                        // Must always call onReceiveValue (even with null) to avoid
                        // permanently blocking future file chooser requests
                        fileUploadCallback.onReceiveValue(results);
                        fileUploadCallback = null;
                    }
            );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        // Inject custom User-Agent to identify the Android App vs the Website to the server
        String defaultUserAgent = ws.getUserAgentString();
        ws.setUserAgentString(defaultUserAgent + " KelebiaApp/" + BuildConfig.VERSION_NAME);

        // Enable cookies (needed for JWT / session auth)
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Handle navigation inside the WebView (SPA support)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Keep same-origin navigation in the WebView
                if (url.startsWith(APP_URL)) {
                    return false;
                }
                // Open external links in the system browser
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
        });

        // Handle file upload (<input type="file">)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                // Cancel any pending callback to avoid blocking
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = callback;

                // Build an intent that supports multiple file selection
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");

                // Allow selecting multiple files at once (#19 fix)
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                // Carry over accepted MIME types from the page's <input> accept attribute
                if (params.getAcceptTypes() != null && params.getAcceptTypes().length > 0) {
                    String[] acceptTypes = params.getAcceptTypes();
                    // Filter out empty strings
                    java.util.List<String> validTypes = new java.util.ArrayList<>();
                    for (String type : acceptTypes) {
                        if (type != null && !type.isEmpty()) {
                            validTypes.add(type);
                        }
                    }
                    if (validTypes.size() == 1) {
                        intent.setType(validTypes.get(0));
                    } else if (validTypes.size() > 1) {
                        intent.setType("*/*");
                        intent.putExtra(Intent.EXTRA_MIME_TYPES,
                                validTypes.toArray(new String[0]));
                    }
                }

                try {
                    // Use the modern ActivityResultLauncher instead of
                    // deprecated startActivityForResult (#21 fix)
                    fileChooserLauncher.launch(
                            Intent.createChooser(intent, "Choose files")
                    );
                } catch (Exception e) {
                    fileUploadCallback.onReceiveValue(null);
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Add DownloadListener to handle file downloads in the WebView
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent,
                                        String contentDisposition, String mimeType,
                                        long contentLength) {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                
                request.setMimeType(mimeType);
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                
                request.setDescription("Downloading file...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, 
                        URLUtil.guessFileName(url, contentDisposition, mimeType));
                
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                try {
                    dm.enqueue(request);
                    Toast.makeText(getApplicationContext(), "Downloading File", Toast.LENGTH_LONG).show();
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "Error downloading file", Toast.LENGTH_LONG).show();
                }
            }
        });

        // Check if launched from a Push Notification
        Intent launchIntent = getIntent();
        String initialUrl = APP_URL;
        if (launchIntent != null && launchIntent.hasExtra("target_url")) {
            String target = launchIntent.getStringExtra("target_url");
            if (target != null && !target.isEmpty()) {
                if (target.startsWith("http")) {
                    initialUrl = target;
                } else {
                    if (!target.startsWith("/")) {
                        target = "/" + target;
                    }
                    initialUrl = APP_URL + target;
                }
            }
        }
        webView.loadUrl(initialUrl);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent.hasExtra("target_url")) {
            String target = intent.getStringExtra("target_url");
            if (target != null && !target.isEmpty()) {
                String fullUrl = target.startsWith("http") ? target : APP_URL + (target.startsWith("/") ? "" : "/") + target;
                if (webView != null) {
                    webView.loadUrl(fullUrl);
                }
            }
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        // Let WebView handle back navigation (SPA history)
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
