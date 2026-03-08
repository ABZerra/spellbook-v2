#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

SUPPORTED_EXTENSIONS = {
    ".md": "markdown",
    ".txt": "text",
    ".json": "json",
}

CANONICAL_KEYS = (
    "title",
    "date",
    "participants",
    "source",
    "project",
    "type_hint",
    "github_repo",
    "language",
    "has_timestamps",
    "has_speakers",
)


def parse_scalar_value(value: str) -> Any:
    lowered = value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip().strip("'\"") for part in inner.split(",") if part.strip()]
    return strip_quotes(value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize a meeting transcript into PAAL's canonical Markdown format."
    )
    parser.add_argument("input_path", help="Transcript source file (.md, .txt, or .json).")
    parser.add_argument(
        "--output",
        help="Optional output Markdown path. Defaults to stdout.",
    )
    parser.add_argument("--title", help="Override the meeting title.")
    parser.add_argument("--date", help="Override the meeting date.")
    parser.add_argument(
        "--participant",
        action="append",
        default=[],
        help="Add a participant. May be provided multiple times.",
    )
    parser.add_argument("--source", help="Override the meeting source.")
    parser.add_argument("--project", help="Override the project name.")
    parser.add_argument("--type-hint", dest="type_hint", help="Override the meeting type hint.")
    parser.add_argument("--github-repo", dest="github_repo", help="Override the GitHub repo slug.")
    parser.add_argument("--language", help="Override the transcript language.")
    parser.add_argument(
        "--has-timestamps",
        choices=("auto", "true", "false"),
        default="auto",
        help="Set whether the transcript contains timestamps.",
    )
    parser.add_argument(
        "--has-speakers",
        choices=("auto", "true", "false"),
        default="auto",
        help="Set whether the transcript contains speaker labels.",
    )
    return parser.parse_args()


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text.strip()

    end_index = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end_index = idx
            break
    if end_index is None:
        return {}, text.strip()

    metadata: dict[str, Any] = {}
    current_key: str | None = None
    current_list: list[str] | None = None
    for raw in lines[1:end_index]:
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("- ") and current_key and current_list is not None:
            current_list.append(stripped[2:].strip())
            continue
        if ":" not in line:
            current_key = None
            current_list = None
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not value:
            metadata[key] = []
            current_key = key
            current_list = metadata[key]
            continue
        metadata[key] = parse_scalar_value(value)
        current_key = None
        current_list = None

    body = "\n".join(lines[end_index + 1 :]).strip()
    return metadata, body


def strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def normalize_markdown(text: str, input_path: Path) -> tuple[dict[str, Any], str]:
    metadata, body = parse_frontmatter(text)
    if not body:
        body = text.strip()
    return metadata, body


def normalize_text(text: str, input_path: Path) -> tuple[dict[str, Any], str]:
    return {}, text.strip()


def normalize_json(text: str, input_path: Path) -> tuple[dict[str, Any], str]:
    payload = json.loads(text)
    if not isinstance(payload, dict):
        raise ValueError("JSON transcript must be an object.")

    metadata = {key: payload[key] for key in CANONICAL_KEYS if key in payload}
    transcript = payload.get("transcript") or payload.get("body") or payload.get("text")

    if transcript is None and isinstance(payload.get("utterances"), list):
        lines: list[str] = []
        has_speakers = False
        has_timestamps = False
        for item in payload["utterances"]:
            if not isinstance(item, dict):
                continue
            speaker = str(item.get("speaker", "")).strip()
            timestamp = str(item.get("timestamp", "")).strip()
            content = str(item.get("text", "")).strip()
            if not content:
                continue
            prefix_parts = []
            if timestamp:
                prefix_parts.append(f"[{timestamp}]")
                has_timestamps = True
            if speaker:
                prefix_parts.append(f"{speaker}:")
                has_speakers = True
            prefix = " ".join(prefix_parts).strip()
            lines.append(f"{prefix} {content}".strip())
        transcript = "\n".join(lines).strip()
        metadata.setdefault("has_speakers", has_speakers)
        metadata.setdefault("has_timestamps", has_timestamps)

    if transcript is None:
        raise ValueError("JSON transcript must contain transcript, body, text, or utterances.")

    return metadata, str(transcript).strip()


def humanize_stem(stem: str) -> str:
    clean = re.sub(r"[_-]+", " ", stem).strip()
    return " ".join(word.capitalize() for word in clean.split()) or "Untitled Meeting"


def infer_bool(value: str, body: str) -> bool | None:
    if value == "true":
        return True
    if value == "false":
        return False
    return None


def infer_transcript_flags(body: str) -> tuple[bool, bool]:
    has_timestamps = bool(re.search(r"\[\d{1,2}:\d{2}(?::\d{2})?\]", body))
    has_speakers = bool(re.search(r"^[A-Za-z0-9 _.-]{2,30}:\s", body, flags=re.MULTILINE))
    return has_timestamps, has_speakers


def merge_metadata(
    metadata: dict[str, Any], body: str, input_path: Path, args: argparse.Namespace
) -> dict[str, Any]:
    merged = dict(metadata)
    merged.setdefault("title", humanize_stem(input_path.stem))

    if args.title:
        merged["title"] = args.title
    if args.date:
        merged["date"] = args.date
    if args.participant:
        merged["participants"] = args.participant
    elif isinstance(merged.get("participants"), str):
        merged["participants"] = [part.strip() for part in merged["participants"].split(",") if part.strip()]
    if args.source:
        merged["source"] = args.source
    if args.project:
        merged["project"] = args.project
    if args.type_hint:
        merged["type_hint"] = args.type_hint
    if args.github_repo:
        merged["github_repo"] = args.github_repo
    if args.language:
        merged["language"] = args.language

    inferred_timestamps, inferred_speakers = infer_transcript_flags(body)
    existing_has_timestamps = merged.get("has_timestamps")
    existing_has_speakers = merged.get("has_speakers")
    merged["has_timestamps"] = (
        infer_bool(args.has_timestamps, body)
        if infer_bool(args.has_timestamps, body) is not None
        else (
            existing_has_timestamps
            if isinstance(existing_has_timestamps, bool)
            else inferred_timestamps
        )
    )
    merged["has_speakers"] = (
        infer_bool(args.has_speakers, body)
        if infer_bool(args.has_speakers, body) is not None
        else (
            existing_has_speakers
            if isinstance(existing_has_speakers, bool)
            else inferred_speakers
        )
    )

    return merged


def format_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    text = str(value)
    if not text:
        return '""'
    if any(char in text for char in (":", "#", "{", "}", "[", "]")) or text[0] in {"-", "@", "&", "!", "*", "?", "%"}:
        escaped = text.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return text


def render_frontmatter(metadata: dict[str, Any]) -> str:
    lines = ["---"]
    for key in CANONICAL_KEYS:
        if key not in metadata:
            continue
        value = metadata[key]
        if value in ("", None, []):
            continue
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"  - {item}")
            continue
        lines.append(f"{key}: {format_scalar(value)}")
    lines.append("---")
    return "\n".join(lines)


def build_output(metadata: dict[str, Any], body: str) -> str:
    transcript_body = body.strip()
    sections = [render_frontmatter(metadata), "", "## Transcript", "", transcript_body]
    return "\n".join(section for section in sections if section is not None).strip() + "\n"


def main() -> int:
    args = parse_args()
    input_path = Path(args.input_path)
    if not input_path.exists():
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        return 1

    mode = SUPPORTED_EXTENSIONS.get(input_path.suffix.lower())
    if mode is None:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        print(f"Unsupported extension '{input_path.suffix}'. Supported: {supported}", file=sys.stderr)
        return 1

    text = input_path.read_text(encoding="utf-8")
    if mode == "markdown":
        metadata, body = normalize_markdown(text, input_path)
    elif mode == "text":
        metadata, body = normalize_text(text, input_path)
    else:
        try:
            metadata, body = normalize_json(text, input_path)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 1

    if not body.strip():
        print("Transcript body must not be empty.", file=sys.stderr)
        return 1

    merged = merge_metadata(metadata, body, input_path, args)
    output = build_output(merged, body)

    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
