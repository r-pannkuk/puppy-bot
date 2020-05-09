class Reminder {
    constructor({
        id=Reminder._id++,
        createdAt = Date.now(),
        reminderTime = null, 
        originalReminderTime = null,
        isRepeat = false,
        repeatInterval = null,
        executionNumber = 0,
        target = null,
        author = null, 
        message = null, 
        source = null,
        isEnabled = false,
        isFired = false,
        discordMessageId = null,
        scheduleName = null,
        currentJob = null
    }) {
        this.id = id;
        this.creationTime = createdAt;
        this.reminderTime = reminderTime;
        this.originalReminderTime = originalReminderTime;
        this.isRepeat = isRepeat;
        this.repeatInterval = repeatInterval;
        this.executionNumber = executionNumber;
        this.target = target;
        this.author = author;
        this.message = message;
        this.source = source;
        this.isEnabled = isEnabled;
        this.isFired = isFired;
        this.discordMessageId = discordMessageId;
        this.scheduleName = scheduleName;
        this.currentJob = currentJob;
    }
}

Reminder._id = 1;

module.exports = Reminder;