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

  // document.getElementById("vtt-copy-plain").onclick = function() {
  //   navigator.clipboard.writeText(sanitizedVTT);
  //   alert("Sanitized VTT copied to clipboard!");
  // };

  document.getElementById("txt-download").onclick = function() {
    const blob = new Blob([sanitizedVTT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("vtt-download").onclick = function() {
    const blob = new Blob([updatedVTT], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };
});
