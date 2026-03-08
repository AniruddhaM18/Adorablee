"use client";
import { cn } from "@/lib/utils";
import React, { useMemo, useRef, useState } from "react";

export const BackgroundRippleEffect = ({
  rows = 10,
  cols = 27,
  cellSize = 56,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full -translate-x-[10px]",
        // neutral dark palette
        "[--cell-border-color:rgb(55,65,81)]",     // slate-700
        "[--cell-fill-color:rgb(10,12,16)]",       // graphite black
        "[--cell-hover-fill:rgb(17,24,39)]",       // slate-900
        "[--cell-glow:rgba(255,255,255,0.12)]"     // neutral glow
      )}
    >
      <div className="relative h-auto w-auto overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-[2]" />

        <DivGrid
          key={`base-${rippleKey}`}
          className="mask-radial-from-20% mask-radial-at-top"
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          onCellClick={(row, col) => {
            setClickedCell({ row, col });
            setRippleKey((k) => k + 1);
          }}
          interactive
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const EXTRA_FADE_ROWS = 3;

const DivGrid = ({
  className,
  rows = 10,
  cols = 30,
  cellSize = 56,
  borderColor,
  fillColor,
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const totalRows = rows + EXTRA_FADE_ROWS;

  const cells = useMemo(
    () => Array.from({ length: totalRows * cols }, (_, idx) => idx),
    [totalRows, cols]
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${totalRows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: totalRows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-[3]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;

        const isPrimaryRow = rowIdx === 8;
        const isSecondaryRow = rowIdx === 6 || rowIdx === 7;
        const isTertiaryRow = rowIdx === 5;
        const isFadedRow = rowIdx === 2 || rowIdx === 3;

        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;

        const delay = clickedCell ? Math.max(0, distance * 55) : 0;
        const duration = 200 + distance * 80;

        let opacity = isPrimaryRow
          ? 0.9
          : isSecondaryRow
          ? 0.75
          : isTertiaryRow
          ? 0.6
          : isFadedRow
          ? 0.25
          : 0.4;

        if (rowIdx >= rows) {
          const fadeProgress = (rowIdx - rows + 1) / (EXTRA_FADE_ROWS + 1);
          opacity = opacity * (1 - fadeProgress);
        }

        const style: CellStyle = {
          backgroundColor: fillColor,
          borderColor,
          opacity,
          ...(clickedCell && {
            "--delay": `${delay}ms`,
            "--duration": `${duration}ms`,
          }),
        };

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px]",
              "transition-[opacity,background-color,box-shadow] duration-200 ease-out",
              interactive &&
                "hover:bg-[var(--cell-hover-fill)] hover:opacity-100",
              interactive &&
                "hover:shadow-[inset_0_0_30px_var(--cell-glow),0_0_18px_-6px_var(--cell-glow)]",
              clickedCell &&
                "animate-cell-ripple [animation-fill-mode:none]",
              !interactive && "pointer-events-none"
            )}
            style={style}
            onClick={
              interactive ? () => onCellClick(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};
