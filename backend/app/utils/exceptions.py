class AmbiguousTaskMatchError(Exception):
    def __init__(self, tasks):
        self.tasks = tasks
        super().__init__("Multiple similar tasks found")