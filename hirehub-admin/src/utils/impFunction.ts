export const dateFormaterFunc = (date) =>
  `${date.date()}-${date.month() + 1}-${date.year()}`;

export const compareByCTime = (preTime) => {
  const createdAtDate = new Date(preTime);
  let currentTime = new Date();
  setTimeout(() => {
    currentTime = new Date();
  }, 5000);
  // Calculate the difference in milliseconds
  const differenceInMs = currentTime.getTime() - createdAtDate.getTime();

  // Convert the difference to minutes
  const differenceInMinutes = Math.floor(differenceInMs / (1000 * 60));
  if (differenceInMinutes < 1) {
    return "Just Now";
  } else if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  } else if (differenceInMinutes < 1440) {
    return `${Math.floor(differenceInMinutes / 60)} hour ago`;
  } else if (differenceInMinutes < 10080) {
    // return `${Math.floor(differenceInMinutes / 1440)} day ago`;
    const dayName = createdAtDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const time = createdAtDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayName}, ${time}`;
  } else if (differenceInMinutes < 43800) {
    return `${Math.floor(differenceInMinutes / 10080)} week ago`;
  } else if (differenceInMinutes < 525600) {
    return `${Math.floor(differenceInMinutes / 43800)} month ago`;
  } else {
    return `${Math.floor(differenceInMinutes / 525600)} year ago`;
  }
};
