"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const certificates = [
  { src: "/images/certificate1.jpeg", alt: "PCSiR laboratory test report for Kohisaar Shilajit" },
  { src: "/images/certificate2.jpeg", alt: "Kohisaar Shilajit supplier and product sourcing certificate" },
  { src: "/images/certificate3.jpeg", alt: "GS1 Pakistan company certificate for Kohisaar Shilajit" },
  { src: "/images/certificate4.jpeg", alt: "Federal Board of Revenue taxpayer registration certificate for Kohisaar Shilajit" },
  { src: "/images/certificate5.jpeg", alt: "Federal Board of Revenue taxpayer registration certificate for Kohisaar Shilajit" },
];

export function CertificatesSection() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeCertificate = activeIndex === null ? null : certificates[activeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activeIndex === null || !dialog || dialog.open) return;
    dialog.showModal();
    closeButtonRef.current?.focus();
  }, [activeIndex]);

  const closePreview = () => dialogRef.current?.close();

  return (
    <section id="certificates" className="home-section certificates-section" aria-labelledby="certificates-heading">
      <div className="page-shell certificates-section__inner">
        <div className="certificates-section__heading">
          <p className="eyebrow">QUALITY &amp; AUTHENTICITY</p>
          <h2 id="certificates-heading">Certified Quality You Can Trust</h2>
          <p className="certificates-section__intro">
            Explore the available certificates and reports that accompany Kohisaar Shilajit. Open any document for a closer look.
          </p>
        </div>

        <div className="certificates-grid">
          {certificates.map((certificate, index) => (
            <button
              className="certificate-card"
              key={certificate.src}
              type="button"
              aria-haspopup="dialog"
              aria-label={`Open certificate ${index + 1}: ${certificate.alt}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="certificate-card__image-frame">
                <Image
                  src={certificate.src}
                  alt={certificate.alt}
                  fill
                  sizes="(max-width: 800px) 44vw, (max-width: 1024px) 30vw, 20vw"
                  className="certificate-card__image"
                />
              </span>
              <span className="certificate-card__meta">
                <span>DOCUMENT {String(index + 1).padStart(2, "0")}</span>
                <span className="certificate-card__open">View preview <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="certificate-lightbox"
        aria-label="Certificate preview"
        onClose={() => setActiveIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closePreview();
        }}
      >
        {activeCertificate && activeIndex !== null ? (
          <div className="certificate-lightbox__content">
            <div className="certificate-lightbox__toolbar">
              <p>DOCUMENT {String(activeIndex + 1).padStart(2, "0")} / {String(certificates.length).padStart(2, "0")}</p>
              <button ref={closeButtonRef} type="button" className="certificate-lightbox__close" onClick={closePreview} aria-label="Close certificate preview">
                <X size={20} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <div className="certificate-lightbox__image-frame">
              <Image
                src={activeCertificate.src}
                alt={activeCertificate.alt}
                fill
                sizes="92vw"
                loading="eager"
                className="certificate-lightbox__image"
              />
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
