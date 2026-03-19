import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, boardAPI, taskAPI } from '../api/services';
import { useProjectSocket } from '../hooks/useSocket';
import TaskCard from '../components/task/TaskCard';
import TaskDetailModal from '../components/task/TaskDetailModal';
import CreateTaskModal from '../components/task/CreateTaskModal';
import CreateBoardModal from '../components/board/CreateBoardModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [boards, setBoards] = useState([]);
  const [tasksByBoard, setTasksByBoard] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createTaskBoard, setCreateTaskBoard] = useState(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [view, setView] = useState('board'); // board | list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [projRes, boardsRes, statsRes] = await Promise.all([
        projectAPI.getOne(projectId),
        boardAPI.getByProject(projectId),
        projectAPI.getStats(projectId),
      ]);
      setProject(projRes.data.project);
      setStats(statsRes.data.stats);
      const bds = boardsRes.data.boards;
      setBoards(bds);

      const taskMap = {};
      await Promise.all(
        bds.map(async (b) => {
          const { data } = await taskAPI.getByBoard(b._id);
          taskMap[b._id] = data.tasks;
        })
      );
      setTasksByBoard(taskMap);
    } catch (e) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time socket updates
  useProjectSocket(projectId, {
    onTaskCreated: (task) => {
      setTasksByBoard(prev => ({
        ...prev,
        [task.board]: [...(prev[task.board] || []), task],
      }));
    },
    onTaskUpdated: (task) => {
      setTasksByBoard(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(boardId => {
          updated[boardId] = updated[boardId]?.map(t => t._id === task._id ? task : t) || [];
        });
        return updated;
      });
    },
    onTaskDeleted: ({ taskId }) => {
      setTasksByBoard(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(boardId => {
          updated[boardId] = updated[boardId]?.filter(t => t._id !== taskId) || [];
        });
        return updated;
      });
    },
  });

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceBoardId = source.droppableId;
    const destBoardId = destination.droppableId;

    // Optimistic update
    setTasksByBoard(prev => {
      const updated = { ...prev };
      const sourceTasks = [...(updated[sourceBoardId] || [])];
      const [movedTask] = sourceTasks.splice(source.index, 1);

      if (sourceBoardId === destBoardId) {
        sourceTasks.splice(destination.index, 0, movedTask);
        updated[sourceBoardId] = sourceTasks;
      } else {
        const destTasks = [...(updated[destBoardId] || [])];
        destTasks.splice(destination.index, 0, { ...movedTask, board: destBoardId });
        updated[sourceBoardId] = sourceTasks;
        updated[destBoardId] = destTasks;
      }
      return updated;
    });

    try {
      await taskAPI.move(draggableId, { boardId: destBoardId, order: destination.index });
    } catch {
      toast.error('Failed to move task');
      loadData(); // revert
    }
  };

  const handleTaskCreated = (task) => {
    setTasksByBoard(prev => ({
      ...prev,
      [task.board]: [...(prev[task.board] || []), task],
    }));
    setCreateTaskBoard(null);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasksByBoard(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(boardId => {
        updated[boardId] = updated[boardId]?.map(t => t._id === updatedTask._id ? { ...t, ...updatedTask } : t) || [];
      });
      return updated;
    });
  };

  const handleTaskDeleted = (taskId) => {
    setTasksByBoard(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(boardId => {
        updated[boardId] = updated[boardId]?.filter(t => t._id !== taskId) || [];
      });
      return updated;
    });
    setSelectedTask(null);
  };

  const handleBoardCreated = async (board) => {
    setBoards(prev => [...prev, board]);
    setTasksByBoard(prev => ({ ...prev, [board._id]: [] }));
    setShowCreateBoard(false);
  };

  const handleDeleteBoard = async (boardId) => {
    if (!confirm('Delete this board and all its tasks?')) return;
    try {
      await boardAPI.delete(boardId);
      setBoards(prev => prev.filter(b => b._id !== boardId));
      setTasksByBoard(prev => { const u = { ...prev }; delete u[boardId]; return u; });
      toast.success('Board deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board');
    }
  };

  const filteredTasks = (boardId) => {
    let tasks = tasksByBoard[boardId] || [];
    if (searchQuery) tasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterPriority) tasks = tasks.filter(t => t.priority === filterPriority);
    return tasks;
  };

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div className="skeleton" style={{ height: 90, borderRadius: 16, marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ minWidth: 280, height: 400, borderRadius: 16, flexShrink: 0 }} />)}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.4rem' }}>{project?.icon}</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>{project?.title}</h1>
              {project?.description && <p style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{project.description}</p>}
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2">
            {[
              { label: 'Total', val: stats?.total || 0, color: 'var(--text-2)' },
              { label: 'Done', val: stats?.done || 0, color: 'var(--green)' },
              { label: 'Overdue', val: stats?.overdue || 0, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '5px 12px', borderRadius: 99, background: 'var(--bg-4)',
                fontSize: '0.78rem', fontWeight: 600, color: s.color
              }}>
                {s.val} {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '0.85rem' }}>🔍</span>
            <input className="form-input" placeholder="Search tasks..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, height: 36, fontSize: '0.85rem' }} />
          </div>

          {/* Priority filter */}
          <select className="form-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ height: 36, fontSize: '0.85rem', paddingTop: 0, paddingBottom: 0 }}>
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Progress bar */}
          <div style={{ flex: 1, maxWidth: 180 }}>
            <div className="flex justify-between" style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 4 }}>
              <span>Progress</span><span>{stats?.progress || 0}%</span>
            </div>
            <div className="progress-bar" style={{ height: 5 }}>
              <div className="progress-bar-fill" style={{ width: `${stats?.progress || 0}%`, background: project?.color || 'var(--accent)' }} />
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateBoard(true)}>
            + Column
          </button>
        </div>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px 24px' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, height: '100%', minWidth: 'max-content' }}>
            {boards.map((board) => (
              <BoardColumn
                key={board._id}
                board={board}
                tasks={filteredTasks(board._id)}
                onTaskClick={setSelectedTask}
                onAddTask={() => setCreateTaskBoard(board)}
                onDeleteBoard={() => handleDeleteBoard(board._id)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id || selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {createTaskBoard && (
        <CreateTaskModal
          board={createTaskBoard}
          project={project}
          onClose={() => setCreateTaskBoard(null)}
          onCreated={handleTaskCreated}
        />
      )}

      {showCreateBoard && (
        <CreateBoardModal
          projectId={projectId}
          workspaceId={project?.workspace}
          onClose={() => setShowCreateBoard(false)}
          onCreated={handleBoardCreated}
        />
      )}
    </div>
  );
}

function BoardColumn({ board, tasks, onTaskClick, onAddTask, onDeleteBoard }) {
  const [showMenu, setShowMenu] = useState(false);

  const BOARD_COLORS = {
    'todo': '#64748b',
    'in progress': '#f59e0b',
    'in review': '#8b5cf6',
    'done': '#22c55e',
    'blocked': '#ef4444',
  };
  const color = board.color || BOARD_COLORS[board.name.toLowerCase()] || 'var(--accent)';

  return (
    <div style={{ width: 290, display: 'flex', flexDirection: 'column', flexShrink: 0, maxHeight: '100%' }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '12px 12px 0 0',
        border: '1.5px solid var(--border)', borderBottom: 'none',
      }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-heading)' }}>{board.name}</span>
          <span style={{ background: 'var(--bg-4)', color: 'var(--text-3)', fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
            {tasks.length}
          </span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" onClick={onAddTask} style={{ fontSize: '1rem', color: 'var(--text-3)', padding: '4px 6px' }} title="Add task">+</button>
          {!board.isDefault && (
            <>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowMenu(!showMenu)} style={{ fontSize: '1rem', color: 'var(--text-3)', padding: '4px 6px' }}>⋯</button>
              {showMenu && (
                <div className="dropdown-menu" style={{ right: 0, top: '100%' }} onClick={() => setShowMenu(false)}>
                  <button className="dropdown-item danger" onClick={onDeleteBoard}>Delete Column</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tasks droppable area */}
      <Droppable droppableId={board._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1, overflowY: 'auto', padding: '10px 10px',
              background: snapshot.isDraggingOver ? `${color}12` : 'var(--bg-3)',
              border: `1.5px solid ${snapshot.isDraggingOver ? color : 'var(--border)'}`,
              borderTop: 'none', borderRadius: '0 0 12px 12px',
              transition: 'all 0.15s', minHeight: 200,
            }}
          >
            {tasks.map((task, idx) => (
              <Draggable key={task._id} draggableId={task._id} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ marginBottom: 8, ...provided.draggableProps.style }}
                  >
                    <TaskCard task={task} onClick={() => onTaskClick(task)} isDragging={snapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                No tasks yet
              </div>
            )}

            <button
              className="btn btn-ghost w-full"
              onClick={onAddTask}
              style={{ marginTop: 4, fontSize: '0.825rem', color: 'var(--text-3)', justifyContent: 'center', borderRadius: 9 }}
            >
              + Add Task
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}
