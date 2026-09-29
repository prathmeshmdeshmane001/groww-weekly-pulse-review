"""MCP tool invocation helpers."""
from __future__ import annotations

import json
import logging
import os
import subprocess
from typing import Any

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class MCPConnectionError(Exception):
    """Raised when an MCP server is unreachable or returns an error."""


def call_mcp_tool(server: str, tool: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Call an MCP tool on a running server."""
    mcp_server = os.environ.get(f"MCP_{server.upper().replace('-', '_')}_CMD")
    if not mcp_server:
        raise MCPConnectionError(
            f"MCP server command not configured. Set env var MCP_{server.upper().replace('-', '_')}_CMD"
        )

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool,
            "arguments": arguments,
        },
    }

    try:
        proc = subprocess.run(
            mcp_server,
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
    except FileNotFoundError as exc:
        raise MCPConnectionError(f"MCP server not found: {mcp_server}") from exc
    except subprocess.TimeoutExpired as exc:
        raise MCPConnectionError(f"MCP server timed out: {mcp_server}") from exc
    except subprocess.CalledProcessError as exc:
        raise MCPConnectionError(f"MCP server error: {exc.stderr}") from exc

    try:
        response = json.loads(proc.stdout)
        if "error" in response:
            raise MCPConnectionError(f"MCP tool error: {response['error']}")
        return response.get("result", {})
    except json.JSONDecodeError as exc:
        raise MCPConnectionError(f"Invalid MCP response: {proc.stdout}") from exc
