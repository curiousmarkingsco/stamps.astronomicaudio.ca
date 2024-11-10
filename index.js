document.getElementById("vtt-generate").addEventListener("click", function () {
  const vttContent = document.getElementById("vtt-plaintext").value;
  const seconds = parseFloat(document.getElementById("vtt-seconds").value);
  const block = parseInt(document.getElementById("vtt-block").value, 10);
  const fileName = document.getElementById("vtt-filename").value || "output";

  function updateVTTTimestamps(vttContent, seconds, block) {
    const lines = vttContent.split("\n");
    let currentBlock = 0;
    let inBlock = false;
    // 'add' or 'subtract'
    const arithmeType = document.getElementById('vtt-addsubtract').value;

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

        // Determine operation based on `arithmeType`
        const adjustTime = (time) => {
          return arithmeType === 'Add'
            ? time + seconds
            : Math.max(0, time - seconds);
        };

        const newStart = adjustTime(timestampToSeconds(start));
        const newEnd = adjustTime(timestampToSeconds(end));

        lines[i] = `${secondsToTimestamp(newStart)} --> ${secondsToTimestamp(newEnd)}`;
      }
    }

    return lines.join("\n");
  }


  function sanitizeVTT(inputText) {
    const lines = inputText.split('\n');
    let currentSpeaker = ''; // Keeps track of the last speaker
    let blockNumber = 0;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines or lines with just the block number
      if (!line || /^\d+$/.test(line)) {
        if (/^\d+$/.test(line)) {
          blockNumber = line; // Store block number
          if (line === `${blockNumber}`) result.push(line)
          continue;
        } else {
          continue;
        }
      }

      let newSpeaker = '';
      const speakerMatch = line.match(/^(.+?):$/);
      if (speakerMatch) {
        newSpeaker = speakerMatch[1].trim();
        if (newSpeaker !== currentSpeaker) {
          currentSpeaker = newSpeaker; // Update speaker only if it changes
        }
      }

      const matchedLine = result.findIndex(item => item === `${blockNumber}`);
      if (matchedLine !== -1) {
        if (newSpeaker !== '') {
          result[matchedLine] = `${newSpeaker}:`;
        } else if (currentSpeaker !== '') {
          result[matchedLine] = `${currentSpeaker}:`;
        }
      }

      // Check if the line is a timestamp
      if (line.includes('-->')) {
        // Extract the start timestamp, remove milliseconds, and reformat
        let [start] = line.split(' --> ');
        start = start.split(/[.,]/)[0]; // Remove milliseconds and handle both ',' and '.'

        // Remove "00:" if present at the beginning
        start = start.replace(/^00:/, '');

        // Add the speaker before the timestamp only if it changes
        if (currentSpeaker) {
          result.push(`${start}`);
        } else {
          result.push(`${start}`);
        }
      } else if (line === `${newSpeaker}:`) {
        continue;
      } else {
        // Regular text line, append to the result with the current speaker or block number
        result.push(`${line}\n`);
      }
    }

    return result.join('\n');
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

  document.getElementById("vtt-copy-plain").onclick = function () {
    navigator.clipboard.writeText(sanitizedVTT);
    alert("Sanitized VTT copied to clipboard!");
  };

  txtDownloadBtn.onclick = function () {
    const blob = new Blob([sanitizedVTT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  vttDownloadBtn.onclick = function () {
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
  stateElement.innerHTML = newTruth === 'Subtract' ? '-' : '+';
  document.getElementById('addsubtract-label').innerHTML = `${newTruth} time starting at the beginning block.`
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
