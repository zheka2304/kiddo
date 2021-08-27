import player
import console

# функция для поиска следующего за числом простого числа
# если на вход уже дано простое число, вернет его же
def next_prime(x):
    while True:
        # перебрать все возможные делители
        for i in range(2, x):
            # если делится, значит не простое
            if x % i == 0:
                # перейти к проверки следующего числа и выйти из цикла
                x += 1
                break
        # если из цикла не вышли через break, значит число простое, вернем его
        else:
            return x

# множество всех новых id (используем множество, а не список, потому
# что в конце потребуются уникальные элементы)
robot_ids = set()

# Для всех 5 роботов
for i in range(5):
    # повернуться к роботу и открыть консоль
    player.right()
    player.interact()

    # прочитать id робота
    robot_id = console.read()

    # сгенерировать новый id
    new_id = next_prime(robot_id)

    # если id поменялся (предыдущий был не простым)
    if new_id != robot_id:
        # записать в консоль и добавить в массив измененных id
        robot_ids.add(new_id)
        console.write(new_id)
    else:
        # id простой, записать в консоль 0, чтобы отключить его
        console.write(0)

    # закрыть консоль
    console.close()

    # идти дальше
    player.left()
    player.move(2)

# подойти к терминалу и открыть консоль
player.left()
player.move(3)
player.left()
player.move(5)
player.right()
player.interact()

# записать туда все новые id роботов и закрыть консоль
for new_id in robot_ids:
    console.write(new_id)
console.close()

