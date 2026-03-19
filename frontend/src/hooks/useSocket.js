import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io('/', { autoConnect: true, transports: ['websocket', 'polling'] });
  }
  return socketInstance;
};

export const useSocket = () => {
  const socket = useRef(getSocket());

  useEffect(() => {
    return () => {
      // Don't disconnect on unmount — keep socket alive across navigation
    };
  }, []);

  return socket.current;
};

export const useProjectSocket = (projectId, handlers) => {
  const socket = useSocket();

  useEffect(() => {
    if (!projectId) return;
    socket.emit('join-project', projectId);

    if (handlers.onTaskCreated) socket.on('task:created', handlers.onTaskCreated);
    if (handlers.onTaskUpdated) socket.on('task:updated', handlers.onTaskUpdated);
    if (handlers.onTaskMoved) socket.on('task:moved', handlers.onTaskMoved);
    if (handlers.onTaskDeleted) socket.on('task:deleted', handlers.onTaskDeleted);
    if (handlers.onCommentCreated) socket.on('comment:created', handlers.onCommentCreated);

    return () => {
      socket.emit('leave-project', projectId);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('comment:created');
    };
  }, [projectId]);
};
