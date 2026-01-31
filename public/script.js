const $ = (id) => document.getElementById(id);

const output = $("output");
const exportResult = $("exportResult");
const docRows = $("docRows");

const show = (obj) => {
  output.textContent = JSON.stringify(obj, null, 2);
};

const buildQuery = () => {
  const params = new URLSearchParams();

  const clientReference = $("filterClient").value.trim();
  const documentType = $("filterType").value;
  const status = $("filterStatus").value;
  const q = $("filterQ").value.trim();

  if (clientReference) params.set("clientReference", clientReference);
  if (documentType) params.set("documentType", documentType);
  if (status) params.set("status", status);
  if (q) params.set("q", q);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const fetchDocs = async () => {
  const qs = buildQuery();
  const res = await fetch(`/api/documents${qs}`);
  const data = await res.json();
  renderDocs(data.documents ?? []);
  show(data);
};

const renderDocs = (docs) => {
  docRows.innerHTML = "";

  docs.map(doc => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="small">${doc.id}</td>
      <td>${doc.clientReference}</td>
      <td>${doc.documentType}</td>
      <td>${doc.status}</td>
      <td class="small">${doc.createdAt}</td>
      <td>
        <button data-action="content" data-id="${doc.id}">Content</button>
        <button data-action="status" data-id="${doc.id}">Next Status</button>
        <button data-action="edit" data-id="${doc.id}">Edit</button>
        <button data-action="delete" data-id="${doc.id}">Delete</button>
      </td>
    `;

    docRows.appendChild(tr);
  });
};

$("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    clientReference: $("clientReference").value.trim(),
    documentType: $("documentType").value,
    fileName: $("fileName").value.trim(),
    content: $("content").value
  };

  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  show(data);
  await fetchDocs();
});

$("applyFilters").addEventListener("click", fetchDocs);

$("clearFilters").addEventListener("click", async () => {
  $("filterClient").value = "";
  $("filterType").value = "";
  $("filterStatus").value = "";
  $("filterQ").value = "";
  await fetchDocs();
});

docRows.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "content") {
    const res = await fetch(`/api/documents/${id}/content`);
    const data = await res.json();
    show(data);
    return;
  }

  if (action === "status") {
    // simple “Next Status” demo: RECEIVED->VALIDATED->QUEUED->PROCESSED
    const docRes = await fetch(`/api/documents/${id}`);
    const doc = await docRes.json();

    const flow = ["RECEIVED", "VALIDATED", "QUEUED", "PROCESSED"];
    const idx = flow.findIndex(s => s === doc.status);
    const next = flow[idx + 1];

    if (!next) {
      show({ message: "No next status (maybe PROCESSED/REJECTED)" });
      return;
    }

    const res = await fetch(`/api/documents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });

    const data = await res.json();
    show(data);
    await fetchDocs();
    return;
  }

  if (action === "edit") {
    const newFileName = prompt("New fileName? Leave blank to skip.");
    const newContent = prompt("Replace content? Leave blank to skip content replace.");

    const payload = {};
    if (newFileName) payload.fileName = newFileName;
    if (newContent !== null && newContent !== "") payload.content = newContent;

    const res = await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    show(data);
    await fetchDocs();
    return;
  }

  if (action === "delete") {
    const reason = prompt("Reason for deletion (required):");
    if (!reason) {
      show({ error: "Deletion needs a reason" });
      return;
    }

    const res = await fetch(`/api/documents/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    show(data);
    await fetchDocs();
  }
});

$("exportBtn").addEventListener("click", async () => {
  exportResult.textContent = "Generating export (wait 2.5 seconds)...";
  const res = await fetch("/api/exports/daily");
  const data = await res.json();
  exportResult.textContent = JSON.stringify(data, null, 2);
});

// initial load
fetchDocs();
