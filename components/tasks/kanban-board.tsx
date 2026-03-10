"use client";

import { useState, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { updateTaskStatusAction } from "@/lib/actions/workspace";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const columns = [
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "IN_REVIEW", label: "In review" },
  { id: "DONE", label: "Done" }
] as const;

type TaskCard = {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignee: string | null;
  status: typeof columns[number]["id"];
  project: string;
};

export function KanbanBoard({ tasks }: { tasks: TaskCard[] }) {
  const [items, setItems] = useState(tasks);
  const [, startTransition] = useTransition();

  async function onDragEnd(result: DropResult) {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    const taskId = result.draggableId;
    const nextStatus = destination.droppableId as TaskCard["status"];

    setItems((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));
    startTransition(async () => {
      await updateTaskStatusAction(taskId, nextStatus);
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-3xl bg-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{column.label}</h3>
                  <span className="text-sm text-slate-500">{items.filter((task) => task.status === column.id).length}</span>
                </div>
                <div className="space-y-3">
                  {items
                    .filter((task) => task.status === column.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <p className="mt-2 text-sm text-slate-500">{task.project}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Badge value={task.priority} />
                              <Badge value={task.status} />
                            </div>
                            <p className="mt-4 text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>
                            <p className="mt-1 text-xs text-slate-500">{task.assignee ?? "Unassigned"}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
