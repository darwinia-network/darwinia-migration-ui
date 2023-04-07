import moment from "moment";

/*Use this to format the time ago to your own needs*/
/*moment.updateLocale("en", {
  relativeTime: {
    d: "%d day",
  },
});*/

export const formatDate = (timestamp: number, outputFormat = "YYYY-MM-DD"): string => {
  return moment(timestamp).format(outputFormat);
};

export const toTimeAgo = (time: string | number, isUTC = false, format = "YYYY-MM-DDTHH:mm:ss.SSS") => {
  if (typeof time === "number") {
    return isUTC ? moment.utc(time).fromNow() : moment(time).fromNow();
  }
  return isUTC ? moment.utc(time, format).utc().fromNow() : moment(time, format).utc().fromNow();
};

export const formatTimeInUTC = (time: string, inputFormat = "YYYY-MM-DDTHH:mm:ss.SSS") => {
  const timeInUTC = moment(time, inputFormat).utc(true);
  return `${timeInUTC.format("MMM-DD-YYYY hh:mm:ss A")} +UTC`;
};

export const getMonthsRange = (startTimestamp: number, endTimestamp: number) => {
  return Math.round(moment(endTimestamp).diff(moment(startTimestamp), "months", true));
};
