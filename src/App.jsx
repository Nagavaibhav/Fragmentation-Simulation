import "./App.css";

import { useEffect, useMemo, useState } from "react";

const fragmentationContent = {
  title: "Fragmentation",
  subtitle: "Network-layer packet splitting",
  definition:
    "Fragmentation divides a large IP datagram into smaller fragments so each fragment can pass through a link with a smaller MTU.",
  purpose:
    "It allows communication across networks that support different maximum frame sizes.",
  usage:
    "Seen in IPv4 routing when a packet is larger than the next-hop MTU and fragmentation is permitted.",
  stepwise: [
    "Compare the packet size with the next-hop MTU.",
    "Subtract the IP header size from the MTU to find payload space per fragment.",
    "For non-final fragments, keep payload sizes aligned to multiples of 8 bytes.",
    "Create fragments with their own headers, offsets, and MF flag values.",
    "Reassemble all fragments at the destination using identification and offset values.",
  ],
  parameters: ["Payload size", "Header size", "MTU", "Fragment offset", "More Fragments flag"],
  workedExample: "Payload: 4000 B, Header: 20 B, MTU: 1500 B -> 3 fragments with aligned offsets.",
  video: {
    title: "Fragmentation Video",
    description: "A separate video on IPv4 fragmentation, offsets, MF flag, and reassembly.",
    url: "https://www.youtube.com/watch?v=jbt1AKyJ4gw",
    embed: "https://www.youtube.com/embed/jbt1AKyJ4gw",
  },
  references: [
    {
      label: "RFC 791: Internet Protocol",
      url: "https://www.ietf.org/rfc/rfc791.txt",
    },
    {
      label: "GeeksforGeeks: Introduction to Fragmentation",
      url: "https://www.geeksforgeeks.org/computer-networks/introduction-to-fragmentation/",
    },
  ],
};

const textbookReference = {
  label: "Andrew S. Tanenbaum and David J. Wetherall, Computer Networks",
  url: "https://www.oreilly.com/library/view/computer-networks-fifth/9780133485936/",
};

const virtualLabs = [
  {
    label: "Virtual Labs main portal",
    url: "https://www.vlab.co.in/",
  },
  {
    label: "Amrita Virtual Labs: Computer Networks Lab",
    url: "https://vlab.amrita.edu/?sub=3&brch=257",
  },
];


function formatOffsetValue(value) {
  return String(value).padStart(3, "0");
}

function buildOffsetDiagram(payloadSize, headerSize, fragments) {
  return {
    original: {
      id: "original",
      title: "Original datagram",
      bytes: `Bytes 0000-${Math.max(payloadSize - 1, 0)}`,
      total: payloadSize + headerSize,
      offset: 0,
      mf: fragments.length > 1 ? 1 : 0,
    },
    fragments: fragments.map((fragment) => {
      const byteStart = fragment.offsetUnits * 8;
      const byteEnd = byteStart + fragment.payload - 1;
      return {
        id: `fragment-${fragment.fragmentNumber}`,
        title: `Fragment ${fragment.fragmentNumber}`,
        bytes: `Bytes ${String(byteStart).padStart(4, "0")}-${String(byteEnd).padStart(4, "0")}`,
        total: fragment.totalSize,
        offset: fragment.offsetUnits,
        mf: fragment.moreFragments,
      };
    }),
  };
}

function buildFragmentationSimulation(payloadSize, mtu, headerSize) {
  const safePayload = Number(payloadSize);
  const safeMtu = Number(mtu);
  const safeHeader = Number(headerSize);
  const rawFragmentPayload = safeMtu - safeHeader;
  const alignedFragmentPayload = Math.floor(rawFragmentPayload / 8) * 8;

  if (rawFragmentPayload <= 0) {
    return { error: "MTU must be greater than the header size.", steps: [], fragments: [] };
  }

  if (alignedFragmentPayload <= 0 && safePayload > rawFragmentPayload) {
    return {
      error: "For multi-fragment packets, MTU - header must allow at least 8 bytes of aligned payload.",
      steps: [],
      fragments: [],
    };
  }

  const fragments = [];
  const steps = [];
  let remaining = safePayload;
  let offsetBytes = 0;
  let fragmentNumber = 1;

  while (remaining > 0) {
    const isLast = remaining <= rawFragmentPayload;
    const fragmentPayload = isLast ? remaining : alignedFragmentPayload;
    const totalSize = fragmentPayload + safeHeader;
    const moreFragments = isLast ? 0 : 1;

    fragments.push({
      fragmentNumber,
      payload: fragmentPayload,
      totalSize,
      offsetUnits: offsetBytes / 8,
      moreFragments,
    });

    steps.push({
      fragmentNumber,
      explanation: isLast
        ? `Final fragment carries the remaining ${fragmentPayload} bytes and clears the MF flag.`
        : `Fragment ${fragmentNumber} carries ${fragmentPayload} bytes, which fits the MTU and keeps 8-byte alignment.`,
    });

    remaining -= fragmentPayload;
    offsetBytes += fragmentPayload;
    fragmentNumber += 1;
  }

  return {
    error: "",
    steps,
    fragments,
    fragmentCount: fragments.length,
    maxPayloadPerFragment: alignedFragmentPayload > 0 ? alignedFragmentPayload : rawFragmentPayload,
  };
}

function ScrollButton({ label, targetId, kind = "secondary" }) {
  return (
    <button
      className={`nav-button ${kind}`}
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      {label}
    </button>
  );
}

function App() {
  const [showHelp, setShowHelp] = useState(false);
  const [showDeveloper, setShowDeveloper] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [payloadSize, setPayloadSize] = useState(4000);
  const [mtu, setMtu] = useState(1500);
  const [headerSize, setHeaderSize] = useState(20);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("fragmentation-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
    setIsDarkMode(shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
    window.localStorage.setItem("fragmentation-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const fragmentSimulation = useMemo(
    () => buildFragmentationSimulation(payloadSize, mtu, headerSize),
    [payloadSize, mtu, headerSize]
  );
  const offsetDiagram = useMemo(
    () => buildOffsetDiagram(payloadSize, headerSize, fragmentSimulation.fragments),
    [payloadSize, headerSize, fragmentSimulation.fragments]
  );

  const handleDownload = () => {
    const summary = `${fragmentationContent.title}

Definition: ${fragmentationContent.definition}
Purpose: ${fragmentationContent.purpose}
Where it is used: ${fragmentationContent.usage}
Worked example: ${fragmentationContent.workedExample}`;
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fragmentation-notes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <nav className="top-navbar" aria-label="Utility navigation">
        <button className="nav-button secondary top-nav-button theme-toggle" onClick={() => setIsDarkMode((current) => !current)}>
          {isDarkMode ? "Light mode" : "Dark mode"}
        </button>
        <button className="nav-button secondary top-nav-button" onClick={() => setShowHelp(true)}>
          Help
        </button>
        <button className="nav-button secondary top-nav-button" onClick={handleDownload}>
          Download
        </button>
        <button className="nav-button secondary top-nav-button" onClick={() => setShowDeveloper(true)}>
          Developed by
        </button>
      </nav>

      <header className="hero-section">
        <div className="hero-copy">
          <h1>Fragmentation Simulation</h1>
          <p className="hero-text">
            Explore IPv4 fragmentation in a dedicated web app with explanation, visual fragments, a simulator, and topic-specific references.
          </p>

          <div className="button-row">
            <ScrollButton label="Learn" targetId="concept-overview" kind="primary" />
            <ScrollButton label="Run Simulation" targetId="simulation-panel" kind="secondary" />
            <button
              className="nav-button secondary"
              onClick={() => window.open("https://www.vlab.co.in/", "_blank", "noopener,noreferrer")}
            >
              Virtual Lab Reference
            </button>
          </div>
        </div>
      </header>

      <main className="content-layout">
        <section className="learn-section" id="concept-overview">
          <div className="section-heading">
            <h2>{fragmentationContent.title}</h2>
          </div>

          <article className="topic-card visible solo-card">
            <div className="topic-headline">
              <div>
                <p className="topic-subtitle">{fragmentationContent.subtitle}</p>
                <h3>{fragmentationContent.title}</h3>
              </div>
              <span className="topic-pill">Dedicated App</span>
            </div>

            <p><strong>Definition:</strong> {fragmentationContent.definition}</p>
            <p><strong>Purpose:</strong> {fragmentationContent.purpose}</p>
            <p><strong>Where it is used:</strong> {fragmentationContent.usage}</p>
            <p><strong>Worked example:</strong> {fragmentationContent.workedExample}</p>

            <div className="stepwise-block">
              <h4>Stepwise explanation</h4>
              <ol>
                {fragmentationContent.stepwise.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="parameter-list">
              {fragmentationContent.parameters.map((parameter) => (
                <span key={parameter}>{parameter}</span>
              ))}
            </div>
          </article>
        </section>

        <section className="simulator-section" id="simulation-panel">
          <div className="section-heading">
            <h2>Fragmentation Simulation</h2>
          </div>

          <article className="sim-card solo-card">
            <div className="sim-card-head">
              <h3>Fragmentation Simulator</h3>
              <span>IPv4 packet splitting</span>
            </div>

            <div className="input-grid three-up">
              <label>
                Payload bytes
                <input type="number" min="1" value={payloadSize} onChange={(event) => setPayloadSize(Number(event.target.value) || 0)} />
              </label>
              <label>
                MTU bytes
                <input type="number" min="68" value={mtu} onChange={(event) => setMtu(Number(event.target.value) || 0)} />
              </label>
              <label>
                Header bytes
                <input type="number" min="20" value={headerSize} onChange={(event) => setHeaderSize(Number(event.target.value) || 0)} />
              </label>
            </div>

            {fragmentSimulation.error ? (
              <div className="error-box">{fragmentSimulation.error}</div>
            ) : (
              <>
                <div className="output-box">
                  <p><strong>Payload input:</strong> {payloadSize} bytes</p>
                  <p><strong>MTU input:</strong> {mtu} bytes</p>
                  <p><strong>Header input:</strong> {headerSize} bytes</p>
                  <p><strong>Max aligned payload per full fragment:</strong> {fragmentSimulation.maxPayloadPerFragment} bytes</p>
                  <p><strong>Total fragments created:</strong> {fragmentSimulation.fragmentCount}</p>
                </div>

                <div className="offset-example-card">
                  <div className="offset-example-header">
                    <div>
                      <h4>Fragmentation Offset Diagram</h4>
                      <p>
                        This diagram updates from the current simulator input. The left packet is the original datagram, and the
                        packets on the right show the exact fragments produced by the router for the MTU you entered.
                      </p>
                    </div>
                    <span className="topic-pill">Live offset view</span>
                  </div>

                  <div className="offset-dynamic-layout" aria-label="Fragmentation offset diagram">
                    <div className="offset-origin-column">
                      <article className="offset-packet-card offset-packet-origin">
                        <div className="offset-field-row">
                          <span className="offset-field">14567</span>
                          <span className="offset-field">{offsetDiagram.original.total}</span>
                          <span className="offset-field">MF {offsetDiagram.original.mf}</span>
                          <span className="offset-field offset-highlight">{formatOffsetValue(offsetDiagram.original.offset)}</span>
                        </div>
                        <p className="offset-bytes">{offsetDiagram.original.bytes}</p>
                        <p className="offset-name">{offsetDiagram.original.title}</p>
                      </article>
                    </div>

                    <div className="offset-split-column">
                      {offsetDiagram.fragments.map((packet) => (
                        <div key={packet.id} className="offset-fragment-row">
                          <span className="offset-row-connector" />
                          <article className="offset-packet-card offset-packet-fragment">
                            <div className="offset-field-row">
                              <span className="offset-field">14567</span>
                              <span className="offset-field">{packet.total}</span>
                              <span className="offset-field">MF {packet.mf}</span>
                              <span className="offset-field offset-highlight">{formatOffsetValue(packet.offset)}</span>
                            </div>
                            <p className="offset-bytes">{packet.bytes}</p>
                            <p className="offset-name">{packet.title}</p>
                          </article>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="fragment-visuals">
                  {fragmentSimulation.fragments.map((fragment) => (
                    <div key={fragment.fragmentNumber} className="fragment-card-block">
                      <div className="fragment-bar">
                        <span className="header-segment">Header {headerSize}B</span>
                        <span className="payload-segment">Payload {fragment.payload}B</span>
                      </div>
                      <p>
                        Fragment {fragment.fragmentNumber}: Total = {fragment.totalSize}B, Offset = {fragment.offsetUnits}, MF = {fragment.moreFragments}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="step-list">
                  {fragmentSimulation.steps.map((step) => (
                    <div key={`fragment-${step.fragmentNumber}`} className="step-item">
                      <strong>Step {step.fragmentNumber}</strong>
                      <p>{step.explanation}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>
        </section>

        <section className="video-section">
          <div className="section-heading">
            <h2>{fragmentationContent.video.title}</h2>
          </div>

          <div className="video-card solo-card">
            <div>
              <h3>{fragmentationContent.video.title}</h3>
              <p>{fragmentationContent.video.description}</p>
              <a href={fragmentationContent.video.url} target="_blank" rel="noreferrer">
                Open on YouTube
              </a>
            </div>
            <iframe
              src={fragmentationContent.video.embed}
              title={fragmentationContent.video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        <section className="references-section">
          <div className="section-heading">
            <h2>Fragmentation References</h2>
          </div>

          <div className="reference-grid">
            <article className="reference-card">
              <h3>Prescribed Textbook</h3>
              <ul>
                <li>
                  <a href={textbookReference.url} target="_blank" rel="noreferrer">
                    {textbookReference.label}
                  </a>
                </li>
              </ul>
            </article>

            <article className="reference-card">
              <h3>Topic References</h3>
              <ul>
                {fragmentationContent.references.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>

            <article className="reference-card">
              <h3>Virtual Lab Reference</h3>
              <ul>
                {virtualLabs.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>

      {showHelp ? (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>How to use this app</h3>
            <p>1. Read the concept explanation at the top.</p>
            <p>2. Enter payload, MTU, and header values in the simulator.</p>
            <p>3. Review the fragment cards, offsets, and MF flags.</p>
            <p>4. Use the video and references section for deeper study and documentation support.</p>
            <button className="nav-button primary" onClick={() => setShowHelp(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      {showDeveloper ? (
        <div className="modal-backdrop" onClick={() => setShowDeveloper(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Developed by</h3>

            <div className="profile-section">
              <p className="profile-section-title"><b>Developers:</b></p>
              <div className="profile-list">
                <div className="profile-item">
                  <img className="profile-photo" src="/nagavaibhav.png" alt="Nagavaibhav N" />
                  <div>
                    <p className="profile-name">Nagavaibhav N</p>
                    <p className="profile-role">24BAI1104</p>
                  </div>
                </div>
                <div className="profile-item">
                  <img className="profile-photo" src="/meiyappan.jpeg" alt="Meiyappan K" />
                  <div>
                    <p className="profile-name">Meiyappan K</p>
                    <p className="profile-role">24BAI1143</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <p className="profile-section-title"><b>Guided By:</b></p>
              <div className="profile-list">
                <div className="profile-item">
                  <img className="profile-photo" src="/swaminathan_sir.jpg" alt="Dr. Swaminathan A" />
                  <div>
                    <p className="profile-name">Dr. Swaminathan A</p>
                    <p className="profile-role">Professor, Department of Computer Science</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="nav-button primary" onClick={() => setShowDeveloper(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
