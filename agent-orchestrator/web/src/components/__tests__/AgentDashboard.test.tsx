import React from "react";
import { render, screen, act } from "@testing-library/react";
import AgentDashboard, {
  AgentDashboardProps,
  EventSourceLike,
  MessageEventLike,
} from "../AgentDashboard";

type Listener = (event: MessageEventLike<string>) => void;

class MockEventSource implements EventSourceLike {
  private listeners: Record<string, Set<Listener>> = {};

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = new Set();
    }
    this.listeners[type].add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type]?.delete(listener);
  }

  close() {
    this.listeners = {};
  }

  emit(type: string, data: string) {
    const listeners = this.listeners[type];
    if (!listeners) return;
    const event: MessageEventLike<string> = { data };
    listeners.forEach((listener) => listener(event));
  }
}

describe("AgentDashboard", () => {
  const setup = () => {
    const mockSource = new MockEventSource();
    const props: AgentDashboardProps = {
      sseUrl: "/sse",
      createEventSource: () => mockSource,
    };

    render(<AgentDashboard {...props} />);

    return { mockSource };
  };

  it("renders placeholders when plan data is missing", async () => {
    const { mockSource } = setup();

    await act(async () => {
      mockSource.emit(
        "message",
        JSON.stringify({
          execution: {
            id: "exec-1",
            status: "running",
          },
        })
      );
    });

    expect(await screen.findByText("Awaiting plan title…")).toBeInTheDocument();
    expect(screen.getByText("Awaiting plan summary…")).toBeInTheDocument();
    expect(screen.getByText("No plan steps yet.")).toBeInTheDocument();
    expect(screen.getByText("No tasks have been scheduled.")).toBeInTheDocument();
    expect(screen.getByText("Status: pending")).toBeInTheDocument();
  });

  it("preserves existing plan details when subsequent updates omit the plan", async () => {
    const { mockSource } = setup();

    await act(async () => {
      mockSource.emit(
        "message",
        JSON.stringify({
          execution: {
            id: "exec-1",
            status: "running",
            plan: {
              title: "Initial plan",
              summary: "Do the thing",
              steps: [
                { id: "step-1", title: "Step A", description: "First" },
              ],
            },
          },
        })
      );
    });

    expect(await screen.findByText("Initial plan")).toBeInTheDocument();

    await act(async () => {
      mockSource.emit(
        "message",
        JSON.stringify({
          execution: {
            status: "executing",
            tasks: [{ id: "task-1", label: "Task 1", status: "active" }],
          },
        })
      );
    });

    expect(screen.getByText("Initial plan")).toBeInTheDocument();
    expect(screen.getByText("Do the thing")).toBeInTheDocument();
    expect(screen.getByText("Step A")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Status: active")).toBeInTheDocument();
    expect(screen.getByText("Status: executing")).toBeInTheDocument();
  });
});
