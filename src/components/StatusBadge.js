export default function StatusBadge({ status }) {
  const statusLabels = {
    new: 'New Order',
    designing: 'Designing',
    printing: 'Printing',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
  };

  const badgeClass = `badge badge-${status}`;

  return (
    <span className={badgeClass}>
      {statusLabels[status] || status}
    </span>
  );
}
