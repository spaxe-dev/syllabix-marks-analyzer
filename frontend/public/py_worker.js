
// Pyodide Web Worker for Syllabix

let pyodide = null;
let scriptLoaded = false;

// 1. Initial Setup
async function setupPyodide() {
    if (pyodide) return pyodide;

    // Load remote Pyodide script
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

    pyodide = await loadPyodide();

    // Install Dependencies
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // Install PDFPlumber + Pandas + TQDM (Used by parse_results)
    postMessage({ status: 'loading', message: "Installing Python libraries... (This happens once)" });
    await micropip.install(['pandas', 'pdfplumber', 'openpyxl', 'tqdm']);

    // Load the local parsing script
    postMessage({ status: 'loading', message: "Loading logic..." });
    let response = await fetch('/parse_results.py');
    let code = await response.text();

    // Write code to virtual FS so Python can import it
    pyodide.FS.writeFile("parse_results.py", code);

    console.log("✅ Pyodide Ready!");
    return pyodide;
}

// 2. Message Handler
self.onmessage = async (event) => {
    // Warmup Command
    if (event.data.type === 'init') {
        try {
            await setupPyodide();
            console.log("🔥 Pyodide Warmed Up!");
        } catch (e) { console.error("Warmup failed:", e); }
        return;
    }

    const { fileBuffer, filename } = event.data;

    try {
        if (!pyodide) await setupPyodide();

        postMessage({ status: 'processing', message: `Analyzing ${filename}...` });

        // Write uploaded file to virtual FS
        pyodide.FS.writeFile(filename, new Uint8Array(fileBuffer));

        // Run Python Code!
        // We import the user's function and call it
        let result = await pyodide.runPythonAsync(`
            import js
            from parse_results import parse_pdf
            import json
            
            # Run parser on virtual file
            filename = "${filename}"
            print(f"Processing {filename} inside browser...")
            
            try:
                data = parse_pdf(filename)
                # Serialize result to JSON string to pass back
                json.dumps(data)
            except Exception as e:
                json.dumps({"error": str(e)})
        `);

        // Cleanup virtual file
        pyodide.FS.unlink(filename);

        // Send back JSON result
        postMessage({ status: 'complete', result: JSON.parse(result) });

    } catch (error) {
        console.error("Worker Error:", error);
        postMessage({ status: 'error', error: error.message });
    }
};
