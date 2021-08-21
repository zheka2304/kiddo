import player

# пока количество роботов меньше 5
robot_count = 0
while robot_count < 5:
    # найти робота рядом
    robot = player.find('robot')
    if robot is not None:
        # в зависимости от позиции робота, повернуть в нужную сторону и бежать
        # все вместе должно занять ровно 10 ходов

        # робот сзади, бежать вперед
        if robot[1] < 0:
            player.move(10)
        # робот слева, бежать вправо
        elif robot[0] < 0:
            player.right()
            player.move(9)
        # робот справа, бежать влево
        elif robot[0] > 0:
            player.left()
            player.move(9)
        # робот спереди, бежать назад
        elif robot[1] > 0:
            player.right()
            player.right()
            player.move(8)

        # добавить 1 к количеству роботов
        robot_count += 1
