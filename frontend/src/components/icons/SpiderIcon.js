import React from "react";

/**
 * Realistic, high-fidelity Arachnid Icon with anatomically accurate
 * cephalothorax, fangs (chelicerae), pedipalps, dorsal abdomen markings,
 * and 8 articulated jointed legs.
 */
export default function SpiderIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Spider Cephalothorax (Head/Chest) */}
      <path
        d="M12 4.2C10.6 4.2 9.6 5.3 9.6 6.8C9.6 8.2 10.5 9.2 12 9.2C13.5 9.2 14.4 8.2 14.4 6.8C14.4 5.3 13.4 4.2 12 4.2Z"
        fill="currentColor"
      />

      {/* Spider Abdomen (Opisthosoma) */}
      <path
        d="M12 10C9.4 10 7.8 12.8 7.8 15.6C7.8 18.4 9.6 20.8 12 20.8C14.4 20.8 16.2 18.4 16.2 15.6C16.2 12.8 14.6 10 12 10Z"
        fill="currentColor"
      />

      {/* Dorsal Spine / Hourglass Marking Accent */}
      <path
        d="M12 12L12.8 14.2L12 16.2L11.2 14.2Z"
        fill="white"
        fillOpacity="0.75"
      />
      <path
        d="M12 16.5L12.6 17.8L12 19L11.4 17.8Z"
        fill="white"
        fillOpacity="0.75"
      />

      {/* Spider Eyes (Ocelli Clusters) */}
      <circle cx="11.2" cy="5.4" r="0.45" fill="white" />
      <circle cx="12.8" cy="5.4" r="0.45" fill="white" />
      <circle cx="11.5" cy="6.3" r="0.35" fill="white" />
      <circle cx="12.5" cy="6.3" r="0.35" fill="white" />

      {/* Chelicerae (Fangs) */}
      <path
        d="M11 4.2L10.3 2.5L11.4 3.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 4.2L13.7 2.5L12.6 3.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pedipalps (Front Sensory Feelers) */}
      <path
        d="M10 5.4L8.6 3.6L8.2 2.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 5.4L15.4 3.6L15.8 2.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* === 4 LEFT ARTICULATED LEGS === */}
      {/* Left Leg 1 (Front High Arch) */}
      <path
        d="M10.4 6.2L8.2 4.2L5.2 2.8L2.4 4.5L1.6 7.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Leg 2 (Upper Flank Reach) */}
      <path
        d="M9.8 7.4L7.2 6.2L4.2 6.4L2.0 9.2L1.1 13.0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Leg 3 (Lower Flank Stride) */}
      <path
        d="M9.8 8.6L7.0 9.8L4.2 12.2L2.5 16.0L1.8 20.0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Leg 4 (Rear Anchor Sweep) */}
      <path
        d="M10.4 9.6L8.0 12.2L6.0 16.0L4.2 19.8L3.5 23.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* === 4 RIGHT ARTICULATED LEGS (SYMMETRIC) === */}
      {/* Right Leg 1 (Front High Arch) */}
      <path
        d="M13.6 6.2L15.8 4.2L18.8 2.8L21.6 4.5L22.4 7.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Leg 2 (Upper Flank Reach) */}
      <path
        d="M14.2 7.4L16.8 6.2L19.8 6.4L22.0 9.2L22.9 13.0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Leg 3 (Lower Flank Stride) */}
      <path
        d="M14.2 8.6L17.0 9.8L19.8 12.2L21.5 16.0L22.2 20.0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Leg 4 (Rear Anchor Sweep) */}
      <path
        d="M13.6 9.6L16.0 12.2L18.0 16.0L19.8 19.8L20.5 23.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
