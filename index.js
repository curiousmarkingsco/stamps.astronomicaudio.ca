document.getElementById("vtt-generate").addEventListener("click", function() {
  const vttContent = document.getElementById("vtt-plaintext").value;
  const seconds = parseFloat(document.getElementById("vtt-seconds").value);
  const block = parseInt(document.getElementById("vtt-block").value, 10);
  const fileName = document.getElementById("vtt-filename").value || "output";

  function updateVTTTimestamps(vttContent, seconds, block) {
    const lines = vttContent.split("\n");
    let currentBlock = 0;
    let inBlock = false;

    function timestampToSeconds(timestamp) {
      const parts = timestamp.split(":");
      return (
        parseInt(parts[0], 10) * 3600 +
        parseInt(parts[1], 10) * 60 +
        parseFloat(parts[2])
      );
    }

    function secondsToTimestamp(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (totalSeconds % 60).toFixed(3).padStart(6, "0");
      return `${hours}:${minutes}:${seconds}`;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^\d+$/.test(line)) {
        currentBlock = parseInt(line, 10);
        inBlock = currentBlock >= block;
      }

      if (inBlock && line.includes("-->")) {
        const [start, end] = line.split(" --> ");
        const newStart = Math.max(0, timestampToSeconds(start) - seconds);
        const newEnd = Math.max(0, timestampToSeconds(end) - seconds);
        lines[i] = `${secondsToTimestamp(newStart)} --> ${secondsToTimestamp(newEnd)}`;
      }
    }

    return lines.join("\n");
  }

  function sanitizeVTT(vttContent) {
    const lines = vttContent.split("\n");
    return lines
      .map(line => {
        if (line.includes("-->")) {
          const [start] = line.split(" --> ");
          return start;
        }
        return line;
      })
      .join("\n");
  }

  const updatedVTT = updateVTTTimestamps(vttContent, seconds, block);
  const sanitizedVTT = sanitizeVTT(updatedVTT);

  // Update the textarea with the modified VTT content
  document.getElementById("vtt-plaintext").value = updatedVTT;

  // Enable the download buttons and remove inline styles
  const txtDownloadBtn = document.getElementById("txt-download");
  const vttCopyBtn = document.getElementById("vtt-copy-plain");
  const vttDownloadBtn = document.getElementById("vtt-download");

  txtDownloadBtn.disabled = false;
  vttCopyBtn.disabled = false;
  vttDownloadBtn.disabled = false;
  txtDownloadBtn.style.opacity = "1";
  txtDownloadBtn.style.cursor = "pointer";
  vttCopyBtn.style.opacity = "1";
  vttCopyBtn.style.cursor = "pointer";
  vttDownloadBtn.style.opacity = "1";
  vttDownloadBtn.style.cursor = "pointer";

  document.getElementById("vtt-copy-plain").onclick = function() {
    navigator.clipboard.writeText(sanitizedVTT);
    alert("Sanitized VTT copied to clipboard!");
  };

  txtDownloadBtn.onclick = function() {
    const blob = new Blob([sanitizedVTT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  vttDownloadBtn.onclick = function() {
    const blob = new Blob([updatedVTT], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };
});

function toggleAddSubtractState() {
  const stateElement = document.getElementById('addsubtract-button-state');
  const truthiness = stateElement.getAttribute('data-state');
  const newTruth = truthiness === 'Subtract' ? 'Add' : 'Subtract';
  stateElement.setAttribute('data-state', newTruth);
  document.getElementById('vtt-addsubtract').value = newTruth;
  document.getElementById('addsubtract-label').innerHTML = `${newTruth} time from the beginning block.`
}

// Function to disable download buttons and apply inline styles
function disableDownloadButtons() {
  const txtDownloadBtn = document.getElementById("txt-download");
  const txtCopyBtn = document.getElementById("vtt-copy-plain");
  const vttDownloadBtn = document.getElementById("vtt-download");

  txtDownloadBtn.disabled = true;
  txtCopyBtn.disabled = true;
  vttDownloadBtn.disabled = true;
  txtDownloadBtn.style.opacity = "0.5";
  txtDownloadBtn.style.cursor = "not-allowed";
  txtCopyBtn.style.opacity = "0.5";
  txtCopyBtn.style.cursor = "not-allowed";
  vttDownloadBtn.style.opacity = "0.5";
  vttDownloadBtn.style.cursor = "not-allowed";
}

disableDownloadButtons();

// Add event listeners to inputs to disable buttons when changed
document.getElementById("vtt-plaintext").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-seconds").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-block").addEventListener("input", disableDownloadButtons);
document.getElementById("vtt-filename").addEventListener("input", disableDownloadButtons);
