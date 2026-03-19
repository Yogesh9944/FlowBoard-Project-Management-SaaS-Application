import { format, isAfter, parseISO } from 'date-fns';

const PRIORITY_COLORS = {
  low: { bg: 'transparent', text: 'var(--text-3)', dot: '#5c5c78' },
  medium: { bg: 'var(--yellow-bg)', text: 'var(--yellow)', dot: '#f5c542' },
  high: { bg: 'var(--orange-bg)', text: 'var(--orange)', dot: '#f7934c' },
  critical: { bg: 'var(--red-bg)', text: 'var(--red)', dot: '#f75c6a' },
};

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}
function stringToColor(str) {
  if (!str) return 'var(--accent)';
  const colors = ['#7c6af7', '#22d3a0', '#f5c542', '#4da6ff', '#f7934c', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TaskCard({ task, onClick, isDragging }) {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
  const isOverdue = task.dueDate && isAfter(new Date(), parseISO(task.dueDate)) && task.status !== 'done';
  const checklistDone = task.checklist?.filter(c => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: isDragging ? 'var(--bg-4)' : 'var(--bg-2)',
        border: `1.5px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
          {task.labels.map((label, i) => (
            <span key={i} className="tag" style={{ background: `${label.color}22`, color: label.color, fontSize: '0.65rem' }}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.45, marginBottom: 10, color: 'var(--text)' }}>
        {task.title}
      </p>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: priority.dot }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: priority.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {task.priority}
            </span>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <span style={{
              fontSize: '0.7rem', color: isOverdue ? 'var(--red)' : 'var(--text-3)',
              background: isOverdue ? 'var(--red-bg)' : 'var(--bg-4)',
              padding: '2px 6px', borderRadius: 5, fontWeight: isOverdue ? 600 : 400,
            }}>
              {isOverdue ? '⚠ ' : '📅 '}{format(parseISO(task.dueDate), 'MMM d')}
            </span>
          )}

          {/* Checklist */}
          {checklistTotal > 0 && (
            <span style={{ fontSize: '0.7rem', color: checklistDone === checklistTotal ? 'var(--green)' : 'var(--text-3)', background: 'var(--bg-4)', padding: '2px 6px', borderRadius: 5 }}>
              ✓ {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignedTo?.length > 0 && (
          <div style={{ display: 'flex', marginLeft: 'auto' }}>
            {task.assignedTo.slice(0, 3).map((user, i) => (
              <div
                key={user._id || i}
                className="avatar"
                style={{
                  width: 22, height: 22, fontSize: '0.6rem',
                  background: stringToColor(user.name),
                  marginLeft: i > 0 ? -5 : 0,
                  border: '1.5px solid var(--bg-2)', zIndex: 3 - i,
                }}
                title={user.name}
              >
                {initials(user.name)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
